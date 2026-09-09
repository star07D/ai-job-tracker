import {
  BadGatewayException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PREP_PROVIDER,
  PrepGenerationError,
  PrepUnavailableError,
} from './prep.types';
import type { ParsedJob, PrepProvider } from './prep.types';

@Injectable()
export class ParseService {
  constructor(@Inject(PREP_PROVIDER) private provider: PrepProvider) {}

  async parse(description: string): Promise<ParsedJob> {
    try {
      return await this.provider.extractJob(description);
    } catch (err) {
      if (err instanceof PrepUnavailableError) {
        throw new ServiceUnavailableException(err.message);
      }
      if (err instanceof PrepGenerationError) {
        throw new BadGatewayException(
          `Couldn't read that description (${err.message}). Check GEMINI_API_KEY / GEMINI_MODEL, then try again.`,
        );
      }
      throw err;
    }
  }
}
