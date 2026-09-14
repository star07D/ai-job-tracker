import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailInput,
  EmailProvider,
  EmailSendError,
  EmailUnavailableError,
} from './digest.types';

const DEFAULT_FROM = 'Rolio <onboarding@resend.dev>';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('DIGEST_FROM_EMAIL') || DEFAULT_FROM;
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(input: EmailInput): Promise<void> {
    if (!this.client) {
      throw new EmailUnavailableError();
    }

    const { error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      this.logger.error(`Resend rejected the email: ${error.message}`);
      throw new EmailSendError(error.message);
    }
  }
}
