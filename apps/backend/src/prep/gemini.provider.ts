import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import {
  JobPrep,
  PrepGenerationError,
  PrepInput,
  PrepProvider,
  PrepUnavailableError,
} from './prep.types';

const DEFAULT_MODEL = 'gemini-3.5-flash';
const TIMEOUT_MS = 45_000;

const SYSTEM_INSTRUCTION = `You are a sharp interview coach preparing a candidate for one specific role.
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

const RESPONSE_SCHEMA = {
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
    if (!this.client) {
      throw new PrepUnavailableError();
    }

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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let text: string | undefined;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
          abortSignal: controller.signal,
        },
      });
      text = response.text;
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

    return this.parse(text);
  }

  private parse(text: string | undefined): JobPrep {
    if (!text) {
      throw new PrepGenerationError('Empty response from the model');
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new PrepGenerationError('Model did not return valid JSON');
    }

    const obj = raw as Record<string, unknown>;
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
}
