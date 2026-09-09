import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PrepController } from './prep.controller';
import { PrepService } from './prep.service';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';
import { GeminiProvider } from './gemini.provider';
import { PREP_PROVIDER } from './prep.types';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PrepController, ParseController],
  providers: [
    PrepService,
    ParseService,
    // Swap this line to point PREP_PROVIDER at a different LLM implementation.
    { provide: PREP_PROVIDER, useClass: GeminiProvider },
  ],
})
export class PrepModule {}
