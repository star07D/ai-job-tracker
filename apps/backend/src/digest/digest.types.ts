export interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

/** Thrown by a provider that has no credentials configured. */
export class EmailUnavailableError extends Error {
  constructor(message = 'Email sending is not configured') {
    super(message);
    this.name = 'EmailUnavailableError';
  }
}

/** Thrown when the provider rejects the send (bad key, invalid recipient, etc). */
export class EmailSendError extends Error {
  constructor(message = 'Email send failed') {
    super(message);
    this.name = 'EmailSendError';
  }
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export interface EmailProvider {
  isConfigured(): boolean;
  send(input: EmailInput): Promise<void>;
}
