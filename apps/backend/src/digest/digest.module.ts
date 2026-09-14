import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DigestController } from './digest.controller';
import { DigestService } from './digest.service';
import { ResendProvider } from './resend.provider';
import { EMAIL_PROVIDER } from './digest.types';

@Module({
  imports: [PrismaModule],
  controllers: [DigestController],
  providers: [
    DigestService,
    // Swap this line to point EMAIL_PROVIDER at a different email service.
    { provide: EMAIL_PROVIDER, useClass: ResendProvider },
  ],
})
export class DigestModule {}
