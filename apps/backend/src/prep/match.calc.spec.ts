import { bandForScore, buildResumeMatch } from './match.calc';

describe('bandForScore', () => {
  it('bands the strong/partial boundary at 75', () => {
    expect(bandForScore(75)).toBe('strong');
    expect(bandForScore(74)).toBe('partial');
  });

  it('bands the partial/weak boundary at 45', () => {
    expect(bandForScore(45)).toBe('partial');
    expect(bandForScore(44)).toBe('weak');
  });

  it('bands the extremes', () => {
    expect(bandForScore(100)).toBe('strong');
    expect(bandForScore(0)).toBe('weak');
  });
});

describe('buildResumeMatch', () => {
  const base = {
    summary: 'Decent overlap.',
    strengths: ['React'],
    gaps: ['No Go experience'],
  };

  it('rounds a fractional score and attaches its band', () => {
    expect(buildResumeMatch({ ...base, score: 82.6 })).toEqual({
      score: 83,
      band: 'strong',
      ...base,
    });
  });

  it('clamps a score above 100', () => {
    expect(buildResumeMatch({ ...base, score: 140 }).score).toBe(100);
  });

  it('clamps a score below 0', () => {
    expect(buildResumeMatch({ ...base, score: -12 }).score).toBe(0);
  });

  it('passes summary/strengths/gaps through unchanged', () => {
    const r = buildResumeMatch({ ...base, score: 60 });
    expect(r.summary).toBe(base.summary);
    expect(r.strengths).toBe(base.strengths);
    expect(r.gaps).toBe(base.gaps);
  });
});
