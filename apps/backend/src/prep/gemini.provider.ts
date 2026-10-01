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
  ResumeMatchInput,
  ResumeMatchResult,
} from './prep.types';
import {
  AbortedError,
  shouldTryFallback,
  toGenerationError,
} from './gemini-errors';

const DEFAULT_MODEL = 'gemini-3.5-flash';
// Tried once — when the primary model reports itself overloaded, or when it
// simply doesn't answer in time (seen in practice: fast directly, but
// consistently slow specifically over this server's path to Google) — a
// lighter, usually-available model, better than failing the request outright.
const DEFAULT_FALLBACK_MODEL = 'gemini-flash-latest';
// Per attempt — a timeout now also triggers the fallback (see below), so two
// sequential attempts must still land under the frontend's shortest AI-call
// timeout (autofill, at 45s), with room for network overhead either side.
const TIMEOUT_MS = 18_000;

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

const MATCH_INSTRUCTION = `You are an exacting technical recruiter scoring how well a candidate's résumé
fits ONE specific role. Be honest, not encouraging — a mediocre fit should get a mediocre score.

Rules:
- "score" is 0-100: how well the résumé's actual, evidenced experience matches what this
  role likely requires, inferred from the title, company and any notes given. Do not
  inflate it to be kind.
- "strengths" are concrete overlaps between the résumé and the role — specific skills,
  years of experience, domains, tools — not generic praise like "hard worker".
- "gaps" are concrete, likely-required things the résumé shows no evidence of.
- "summary" is 1-2 sentences giving the headline verdict.
- Keep each list item to one sentence.`;

const MATCH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['score', 'summary', 'strengths', 'gaps'],
  propertyOrdering: ['score', 'summary', 'strengths', 'gaps'],
};

@Injectable()
export class GeminiProvider implements PrepProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;
  private readonly fallbackModel: string | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.model = config.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;
    // unset -> the default fallback; explicitly set to "" -> no fallback at all
    const fallbackRaw = config.get<string>('GEMINI_FALLBACK_MODEL');
    const fallback =
      fallbackRaw === undefined ? DEFAULT_FALLBACK_MODEL : fallbackRaw;
    this.fallbackModel = fallback && fallback !== this.model ? fallback : null;
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

  async matchResume(input: ResumeMatchInput): Promise<ResumeMatchResult> {
    const contents = [
      `Role: ${input.title}`,
      `Company: ${input.company}`,
      input.notes?.trim()
        ? `Notes about the role:\n${input.notes.trim()}`
        : null,
      '',
      "Candidate's résumé:",
      input.resumeText,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const text = await this.request(contents, {
      systemInstruction: MATCH_INSTRUCTION,
      responseSchema: MATCH_SCHEMA,
      // judgment, not creativity — the score should be consistent run to run
      temperature: 0.3,
    });

    return this.parseMatch(text);
  }

  /** One round-trip to Gemini, on the given model, enforcing the timeout. */
  private async attempt(
    model: string,
    contents: string,
    cfg: {
      systemInstruction: string;
      responseSchema: object;
      temperature: number;
    },
  ): Promise<string | undefined> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await this.client!.models.generateContent({
        model,
        contents,
        config: {
          ...cfg,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
          // gemini-3.5-flash defaults to extended thinking even for plain
          // structured-extraction calls like these — routinely 90s+ against
          // this model, well past TIMEOUT_MS. Off, the same call is ~3s.
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return response.text;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Gemini request failed (model=${model}): ${detail}`);
      throw controller.signal.aborted ? new AbortedError(detail) : err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Tries the primary model, then — only if it reports itself overloaded or
   * simply doesn't answer in time, never on an auth failure — the fallback
   * model once. */
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

    try {
      return await this.attempt(this.model, contents, cfg);
    } catch (err) {
      if (this.fallbackModel && shouldTryFallback(err)) {
        const reason =
          err instanceof AbortedError ? 'timed out' : 'is overloaded';
        this.logger.warn(
          `${this.model} ${reason} — retrying once on ${this.fallbackModel}`,
        );
        try {
          return await this.attempt(this.fallbackModel, contents, cfg);
        } catch (err2) {
          throw toGenerationError(err2, this.fallbackModel);
        }
      }
      throw toGenerationError(err, this.model);
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

  private parseMatch(text: string | undefined): ResumeMatchResult {
    const obj = this.parseJson(text);
    const stringArray = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string')
        : [];

    const score = typeof obj.score === 'number' ? obj.score : NaN;
    if (!Number.isFinite(score)) {
      throw new PrepGenerationError('model returned an invalid score');
    }

    const match: ResumeMatchResult = {
      score,
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      strengths: stringArray(obj.strengths),
      gaps: stringArray(obj.gaps),
    };

    const hasContent =
      match.summary.length > 0 ||
      match.strengths.length > 0 ||
      match.gaps.length > 0;
    if (!hasContent) {
      throw new PrepGenerationError('model returned an empty match');
    }

    return match;
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
