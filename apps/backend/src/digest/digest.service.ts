import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_PROVIDER } from './digest.types';
import type { EmailProvider } from './digest.types';

// Mirrors apps/frontend/lib/due.ts + lib/stale.ts. Kept in sync by hand — the
// two apps don't share a package, and this is a handful of lines either way.
const STALE_AFTER_DAYS: Record<string, number> = {
  Applied: 21,
  Interview: 10,
};

interface DigestItem {
  job: Job;
  label: string;
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Whole days from `b` to `a` — positive when `a` is later. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfUtcDay(a) - startOfUtcDay(b)) / 86_400_000);
}

function shortDuration(days: number): string {
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  /** Emails every opted-in user their due follow-ups and gone-quiet applications. */
  async run(): Promise<{ usersChecked: number; emailsSent: number }> {
    if (!this.email.isConfigured()) {
      this.logger.warn('Digest run skipped — no email provider configured');
      return { usersChecked: 0, emailsSent: 0 };
    }

    const users = await this.prisma.user.findMany({
      where: { emailDigestEnabled: true },
      include: { jobs: true },
    });

    const now = new Date();
    let emailsSent = 0;

    for (const user of users) {
      const activeJobs = user.jobs.filter((j) => !j.archived);
      const { dueItems, staleItems } = this.classify(activeJobs, now);
      if (dueItems.length === 0 && staleItems.length === 0) continue;

      try {
        await this.email.send({
          to: user.email,
          subject: this.subjectFor(dueItems.length, staleItems.length),
          html: this.render(dueItems, staleItems),
        });
        emailsSent += 1;
      } catch (err) {
        this.logger.error(
          `Failed to email ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { usersChecked: users.length, emailsSent };
  }

  private classify(jobs: Job[], now: Date) {
    const OPEN_STATUSES = new Set(['Applied', 'Interview']);
    const dueItems: DigestItem[] = [];
    const staleItems: DigestItem[] = [];

    for (const job of jobs) {
      if (job.nextActionDue) {
        const days = daysBetween(job.nextActionDue, now);
        if (days <= 0) {
          dueItems.push({
            job,
            label:
              days === 0
                ? 'Due today'
                : `${-days} day${-days === 1 ? '' : 's'} overdue`,
          });
        }
        // a follow-up is scheduled either way — this job isn't "gone quiet"
        continue;
      }

      const threshold = OPEN_STATUSES.has(job.status)
        ? STALE_AFTER_DAYS[job.status]
        : undefined;
      if (!threshold) continue;

      const days = daysBetween(now, job.statusChangedAt);
      if (days >= threshold) {
        staleItems.push({
          job,
          label: `${shortDuration(days)} in ${job.status}`,
        });
      }
    }

    return { dueItems, staleItems };
  }

  private subjectFor(due: number, stale: number): string {
    const parts: string[] = [];
    if (due) parts.push(`${due} follow-up${due === 1 ? '' : 's'} due`);
    if (stale) parts.push(`${stale} gone quiet`);
    return `Rolio: ${parts.join(' · ')}`;
  }

  private render(dueItems: DigestItem[], staleItems: DigestItem[]): string {
    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    )
      .split(',')[0]
      .trim();
    const jobUrl = (id: string) => `${frontendUrl}/dashboard/job/${id}`;

    const row = (item: DigestItem) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e4e7ec;">
          <a href="${jobUrl(item.job.id)}" style="color:#2e2bff;text-decoration:none;font-weight:600;font-size:14px;">
            ${escapeHtml(item.job.title)}
          </a>
          <div style="color:#5b616e;font-size:13px;margin-top:2px;">
            ${escapeHtml(item.job.company)} &middot;
            <span style="color:#9c6408;font-weight:600;">${escapeHtml(item.label)}</span>
          </div>
        </td>
      </tr>`;

    const section = (title: string, items: DigestItem[]) =>
      items.length === 0
        ? ''
        : `<h2 style="font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#5b616e;margin:24px 0 4px;">${title}</h2>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(row).join('')}</table>`;

    return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111318;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="display:inline-block;width:22px;height:22px;background:#2e2bff;border-radius:6px;"></span>
        <strong style="font-size:16px;">Rolio</strong>
      </div>
      <p style="color:#5b616e;font-size:14px;margin:0;">Here's what needs a look today.</p>
      ${section('Needs attention', dueItems)}
      ${section('Gone quiet', staleItems)}
      <p style="margin-top:28px;font-size:12px;color:#8b92a0;">
        You're getting this because daily email digests are on for your Rolio account.
        Turn it off any time from the account menu.
      </p>
    </div>`;
  }
}
