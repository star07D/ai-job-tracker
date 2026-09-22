import { BadRequestException } from '@nestjs/common';
import type PdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ResumeParserService } from './resume-parser.service';

jest.mock('pdf-parse/lib/pdf-parse.js');
jest.mock('mammoth');

/* eslint-disable @typescript-eslint/no-require-imports */
const mockPdfParse =
  require('pdf-parse/lib/pdf-parse.js') as jest.MockedFunction<typeof PdfParse>;
/* eslint-enable @typescript-eslint/no-require-imports */
const mockExtractRawText = mammoth.extractRawText as jest.MockedFunction<
  typeof mammoth.extractRawText
>;

function pdfFile(): Express.Multer.File {
  return {
    mimetype: 'application/pdf',
    buffer: Buffer.from('irrelevant'),
  } as Express.Multer.File;
}

function docxFile(): Express.Multer.File {
  return {
    mimetype:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('irrelevant'),
  } as Express.Multer.File;
}

describe('ResumeParserService', () => {
  let service: ResumeParserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ResumeParserService();
  });

  it('extracts text from a PDF via pdf-parse', async () => {
    mockPdfParse.mockResolvedValue({
      text: 'A '.repeat(40) + 'long enough résumé body.',
    } as never);

    const text = await service.extractText(pdfFile());

    expect(mockPdfParse).toHaveBeenCalled();
    expect(text).toContain('long enough résumé body.');
  });

  it('extracts text from a .docx via mammoth', async () => {
    mockExtractRawText.mockResolvedValue({
      value: 'B '.repeat(40) + 'long enough résumé body.',
      messages: [],
    });

    const text = await service.extractText(docxFile());

    expect(mockExtractRawText).toHaveBeenCalled();
    expect(text).toContain('long enough résumé body.');
  });

  it('collapses whitespace', async () => {
    mockPdfParse.mockResolvedValue({
      text: `Line one.\n\n\tLine   two.   ${'padding '.repeat(10)}`,
    } as never);

    const text = await service.extractText(pdfFile());

    expect(text).not.toMatch(/\s{2,}/);
  });

  it('rejects a file that yields almost no text', async () => {
    mockPdfParse.mockResolvedValue({ text: 'too short' } as never);

    await expect(service.extractText(pdfFile())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('truncates very long extracted text', async () => {
    mockPdfParse.mockResolvedValue({ text: 'x'.repeat(20_000) } as never);

    const text = await service.extractText(pdfFile());

    expect(text.length).toBeLessThan(20_000);
    expect(text).toContain('[truncated]');
  });
});
