import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ParseService } from './parse.service';
import {
  PREP_PROVIDER,
  PrepGenerationError,
  PrepProvider,
  PrepUnavailableError,
} from './prep.types';

describe('ParseService', () => {
  let service: ParseService;
  let provider: jest.Mocked<PrepProvider>;

  beforeEach(async () => {
    provider = {
      isConfigured: jest.fn().mockReturnValue(true),
      generate: jest.fn(),
      extractJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseService, { provide: PREP_PROVIDER, useValue: provider }],
    }).compile();

    service = module.get(ParseService);
  });

  it('passes the description through and returns the parsed fields', async () => {
    provider.extractJob.mockResolvedValue({
      title: 'Staff Engineer',
      company: 'Kensho',
      location: 'Remote',
    });

    await expect(service.parse('a long job description...')).resolves.toEqual({
      title: 'Staff Engineer',
      company: 'Kensho',
      location: 'Remote',
    });
    expect(provider.extractJob).toHaveBeenCalledWith(
      'a long job description...',
    );
  });

  it('maps a not-configured provider to 503', async () => {
    provider.extractJob.mockRejectedValue(new PrepUnavailableError());
    await expect(service.parse('...')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps a generation failure to 502', async () => {
    provider.extractJob.mockRejectedValue(new PrepGenerationError());
    await expect(service.parse('...')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
