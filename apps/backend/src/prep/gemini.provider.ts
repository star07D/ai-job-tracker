import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import {
  JobPrep,
  ParsedJob,
  PrepGenerationError,
  PrepInput,
  PrepProvider,
  PrepUnavailableError,
} from './prep.types';

const DEFAULT_MODEL = 'gemini-3.5-flash';
const TIMEOUT_MS = 45_000;

const PREP_INSTRUCTION = `You are a sharp interview coach preparing a candidate for one specific role.
Given the role, company and the candidate's own notes, produce focused, practical prep.

Rules:
- Be specific to THIS role and company. No generic filler that would fit any job.
- Ground "talkingPoints" in the candidate's notes when they have any; if notes are
  sparse, infer sensible points from the role and company.
- "likelyQuestions" are questions the interviewer will probably ask this candidate.
- "research" items are concrete things to look up (a product, a competitor, a recent
  launch), not vague advice.
- "questionsToAsk" are thoughtful questions the candidate should ask the interviewer.
- Keep each list item to one or two sentences.`;

const PREP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    likelyQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    research: { type: Type.ARRAY, items: { type: Type.STRING } },
    questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'summary',
    'likelyQuestions',
    'talkingPoints',
    'research',
    'questionsToAsk',
  ],
  propertyOrdering: [
    'summary',
    'likelyQuestions',
    'talkingPoints',
    'research',
    'questionsToAsk',
  ],
};

const EXTRACT_INSTRUCTION = `You extract structured fields from a job posting. Return ONLY what the
posting explicitly states — never guess, infer or invent.

- title: the role title, as written
- company: the hiring company's name (not the recruiting agency, if you can tell them apart)
- location: as written — e.g. "Remote", "Remote (US)", "London, UK", "Hybrid — Berlin"
- salary: the pay range exactly as written, including currency and period
- notes: 2 to 4 short lines covering the core responsibilities and the must-have
  requirements — a quick reference for the candidate, not a summary of the whole posting

Omit any field the posting does not mention.`;

const EXTRACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, nullable: true },
    company: { type: Type.STRING, nullable: true },
    location: { type: Type.STRING, nullable: true },
    salary: { type: Type.STRING, nullable: true },
    notes: { type: Type.STRING, nullable: true },
  },
  propertyOrdering: ['title', 'company', 'location', 'salary', 'notes'],
};

@Injectable()
export class GeminiProvider implements PrepProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.model = config.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generate(input: PrepInput): Promise<JobPrep> {
    const contents = [
      `Role: ${input.title}`,
      `Company: ${input.company}`,
      input.location ? `Location: ${input.location}` : null,
      input.salary ? `Salary: ${input.salary}` : null,
      `Current stage: ${input.status}`,
      '',
      'Candidate notes (may be empty):',
      input.notes?.trim() || '(none provided)',
    ]
      .filter((line) => line !== null)
      .join('\n');

    const text = await this.request(contents, {
      systemInstruction: PREP_INSTRUCTION,
      responseSchema: PREP_SCHEMA,
      temperature: 0.7,
    });

    return this.parsePrep(text);
  }

  async extractJob(description: string): Promise<ParsedJob> {
    const text = await this.request(`Job posting:\n\n${description.trim()}`, {
      systemInstruction: EXTRACT_INSTRUCTION,
      responseSchema: EXTRACT_SCHEMA,
      temperature: 0.2,
    });

    return this.parseExtract(text);
  }

  /** Single round-trip to Gemini: enforces the timeout and turns failures into a hint. */
  private async request(
    contents: string,
    cfg: {
      systemInstruction: string;
      responseSchema: object;
      temperature: number;
    },
  ): Promise<string | undefined> {
    if (!this.client) {
      throw new PrepUnavailableError();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          ...cfg,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
        },
      });
      return response.text;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Gemini request failed (model=${this.model}): ${detail}`,
      );
      // surface a short, useful hint (the user runs this server themselves)
      const hint = controller.signal.aborted
        ? 'the model took too long to respond — try again'
        : /not[_ ]?found|no longer available/i.test(detail)
          ? `model "${this.model}" is unavailable — set GEMINI_MODEL to a current one`
          : /api[_ ]?key|permission|unauthenticated|401|403/i.test(detail)
            ? 'the GEMINI_API_KEY was rejected'
            : /quota|rate|429|503|unavailable/i.test(detail)
              ? 'the model is rate-limited or busy — try again shortly'
              : 'request to Gemini failed';
      throw new PrepGenerationError(hint);
    } finally {
      clearTimeout(timer);
    }
  }

  private parsePrep(text: string | undefined): JobPrep {
    const obj = this.parseJson(text);
    const stringArray = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string')
        : [];

    const prep: JobPrep = {
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      likelyQuestions: stringArray(obj.likelyQuestions),
      talkingPoints: stringArray(obj.talkingPoints),
      research: stringArray(obj.research),
      questionsToAsk: stringArray(obj.questionsToAsk),
    };

    const hasContent =
      prep.summary.length > 0 ||
      prep.likelyQuestions.length > 0 ||
      prep.talkingPoints.length > 0;
    if (!hasContent) {
      throw new PrepGenerationError('Model returned an empty prep');
    }

    return prep;
  }

  private parseExtract(text: string | undefined): ParsedJob {
    const obj = this.parseJson(text);
    const str = (v: unknown): string | undefined => {
      if (typeof v !== 'string') return undefined;
      const trimmed = v.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const parsed: ParsedJob = {};
    for (const key of [
      'title',
      'company',
      'location',
      'salary',
      'notes',
    ] as const) {
      const value = str(obj[key]);
      if (value) parsed[key] = value;
    }

    if (Object.keys(parsed).length === 0) {
      throw new PrepGenerationError(
        "couldn't find any job details in that text",
      );
    }

    return parsed;
  }

  private parseJson(text: string | undefined): Record<string, unknown> {
    if (!text) {
      throw new PrepGenerationError('empty response from the model');
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new PrepGenerationError('model did not return valid JSON');
    }
  }
}
