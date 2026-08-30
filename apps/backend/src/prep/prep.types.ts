export interface JobPrep {
  summary: string;
  likelyQuestions: string[];
  talkingPoints: string[];
  research: string[];
  questionsToAsk: string[];
}

export interface PrepInput {
  title: string;
  company: string;
  status: string;
  location?: string | null;
  salary?: string | null;
  notes?: string | null;
}

/** Thrown by a provider that has no credentials configured. */
export class PrepUnavailableError extends Error {
  constructor(message = 'AI prep is not configured') {
    super(message);
    this.name = 'PrepUnavailableError';
  }
}

/** Thrown when the model responds but the output can't be used. */
export class PrepGenerationError extends Error {
  constructor(message = 'Prep generation failed') {
    super(message);
    this.name = 'PrepGenerationError';
  }
}

export const PREP_PROVIDER = Symbol('PREP_PROVIDER');

export interface PrepProvider {
  /** Whether this provider has what it needs to run. */
  isConfigured(): boolean;
  generate(input: PrepInput): Promise<JobPrep>;
}
