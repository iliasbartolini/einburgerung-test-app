import {
  translateText,
  translateWord,
} from '../translationService';

// Mock the translation repository
const mockGetCachedTranslation = jest.fn();
const mockCacheTranslation = jest.fn();

jest.mock('../../db/repositories/translationRepository', () => ({
  getCachedTranslation: (...args: any[]) => mockGetCachedTranslation(...args),
  cacheTranslation: (...args: any[]) => mockCacheTranslation(...args),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('translateText', () => {
  it('returns cached translation on cache hit', async () => {
    mockGetCachedTranslation.mockResolvedValue({
      translated_text: 'Hello',
    });

    const result = await translateText('Hallo', 'en');

    expect(result).toEqual({ translatedText: 'Hello', fromCache: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns input text unchanged when target is German', async () => {
    mockGetCachedTranslation.mockResolvedValue(null);

    const result = await translateText('Hallo', 'de');

    expect(result).toEqual({ translatedText: 'Hallo', fromCache: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls API and caches result on cache miss', async () => {
    mockGetCachedTranslation.mockResolvedValue(null);
    mockCacheTranslation.mockResolvedValue(undefined);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [['Hello', 'Hallo']],
    });

    const result = await translateText('Hallo', 'en');

    expect(result).toEqual({ translatedText: 'Hello', fromCache: false });
    expect(mockCacheTranslation).toHaveBeenCalledWith('Hallo', 'en', 'Hello');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('clients5.google.com')
    );
  });

  it('handles flat array response format', async () => {
    mockGetCachedTranslation.mockResolvedValue(null);
    mockCacheTranslation.mockResolvedValue(undefined);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ['Hello'],
    });

    const result = await translateText('Hallo', 'en');

    expect(result).toEqual({ translatedText: 'Hello', fromCache: false });
  });

  it('throws TRANSLATION_API_ERROR on non-ok response', async () => {
    mockGetCachedTranslation.mockResolvedValue(null);

    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    await expect(translateText('Hallo', 'en')).rejects.toThrow(
      'TRANSLATION_API_ERROR'
    );
  });

  it('throws TRANSLATION_OFFLINE on network error', async () => {
    mockGetCachedTranslation.mockResolvedValue(null);

    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(translateText('Hallo', 'en')).rejects.toThrow(
      'TRANSLATION_OFFLINE'
    );
  });
});

describe('translateWord', () => {
  it('strips punctuation before translating', async () => {
    mockGetCachedTranslation.mockResolvedValue({
      translated_text: 'Hello',
    });

    const result = await translateWord('"Hallo!"', 'en');

    expect(result).toEqual({ translatedText: 'Hello', fromCache: true });
    expect(mockGetCachedTranslation).toHaveBeenCalledWith('Hallo', 'en');
  });

  it('returns the original word if only punctuation', async () => {
    const result = await translateWord('...', 'en');

    expect(result).toEqual({ translatedText: '...', fromCache: true });
    expect(mockGetCachedTranslation).not.toHaveBeenCalled();
  });
});
