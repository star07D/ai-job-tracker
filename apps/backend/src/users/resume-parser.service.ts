import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import type PdfParse from 'pdf-parse';

// pdf-parse's own index.js runs a debug code path (reading a test fixture
// that isn't shipped) whenever `module.parent` is undefined — true under
// Jest. Its lib file has the real implementation with no such guard.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as typeof PdfParse;

const MIN_CHARS = 50;
const MAX_CHARS = 15_000;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Turns an uploaded PDF/Word file into plain text — nothing else. The binary
 * is never kept; only the extracted text is stored, so this is the one place
 * that ever touches the file's contents.
 */
@Injectable()
export class ResumeParserService {
  async extractText(file: Express.Multer.File): Promise<string> {
    const raw =
      file.mimetype === DOCX_MIME
        ? (await mammoth.extractRawText({ buffer: file.buffer })).value
        : (await pdfParse(file.buffer)).text;

    const text = raw.replace(/\s+/g, ' ').trim();

    if (text.length < MIN_CHARS) {
      throw new BadRequestException(
        "Couldn't read that file — it may be scanned or empty. Try a text-based PDF or Word doc.",
      );
    }

    return text.length > MAX_CHARS
      ? `${text.slice(0, MAX_CHARS)}\n[truncated]`
      : text;
  }
}
