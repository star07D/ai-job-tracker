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
} as const;

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

    return user;
  }

  async updatePreferences(id: string, emailDigestEnabled: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { emailDigestEnabled },
      select: PUBLIC_USER_FIELDS,
    });
  }

  /** Turns the public share link on, issuing a fresh token either way —
   * also how "regenerate" invalidates a previously shared link. */
  async enableSharing(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { shareToken: randomBytes(16).toString('hex') },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async disableSharing(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { shareToken: null },
      select: PUBLIC_USER_FIELDS,
    });
  }
}
