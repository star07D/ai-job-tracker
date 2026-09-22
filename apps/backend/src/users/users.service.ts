import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  emailDigestEnabled: true,
  shareToken: true,
  // never resumeText — it can be up to 15k chars and must never leave this module
  resumeFileName: true,
  resumeUpdatedAt: true,
} as const;

type PublicUser = {
  resumeFileName: string | null;
  resumeUpdatedAt: Date | null;
  [key: string]: unknown;
};

/** hasResume is derived (not a column), so every public-user return passes through this. */
function withHasResume<T extends PublicUser>(user: T) {
  return { ...user, hasResume: !!user.resumeFileName };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_FIELDS,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return withHasResume(user);
  }

  async updatePreferences(id: string, emailDigestEnabled: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { emailDigestEnabled },
      select: PUBLIC_USER_FIELDS,
    });
    return withHasResume(user);
  }

  /** Turns the public share link on, issuing a fresh token either way —
   * also how "regenerate" invalidates a previously shared link. */
  async enableSharing(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { shareToken: randomBytes(16).toString('hex') },
      select: PUBLIC_USER_FIELDS,
    });
    return withHasResume(user);
  }

  async disableSharing(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { shareToken: null },
      select: PUBLIC_USER_FIELDS,
    });
    return withHasResume(user);
  }

  /** Stores the extracted résumé text — replaces whatever was there before. */
  async uploadResume(id: string, resumeText: string, fileName: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        resumeText,
        resumeFileName: fileName,
        resumeUpdatedAt: new Date(),
      },
      select: PUBLIC_USER_FIELDS,
    });
    return withHasResume(user);
  }

  async removeResume(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { resumeText: null, resumeFileName: null, resumeUpdatedAt: null },
      select: PUBLIC_USER_FIELDS,
    });
    return withHasResume(user);
  }
}
