import {
  getCachedTranslation,
  cacheTranslation,
} from '../db/repositories/translationRepository';

const API_BASE = 'https://clients5.google.com/translate_a/t';

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; fromCache: boolean }> {
  // Check cache first
  const cached = await getCachedTranslation(text, targetLanguage);
  if (cached) {
    return { translatedText: cached.translated_text, fromCache: true };
  }

  // Skip translation if target is German (source language)
  if (targetLanguage === 'de') {
    return { translatedText: text, fromCache: false };
  }

  try {
    const params = new URLSearchParams({
      client: 'dict-chrome-ex',
      sl: 'de',
      tl: targetLanguage,
      q: text,
    });

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
      throw new Error('TRANSLATION_API_ERROR');
    }

    const data = await response.json();

    // Response is an array of [translatedText, sourceText] pairs
    const translatedText = Array.isArray(data)
      ? (Array.isArray(data[0]) ? data[0][0] : data[0])
      : data;

    if (typeof translatedText !== 'string') {
      throw new Error('TRANSLATION_API_ERROR');
    }

    // Cache the result
    await cacheTranslation(text, targetLanguage, translatedText);

    return { translatedText, fromCache: false };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network')) {
      throw new Error('TRANSLATION_OFFLINE');
    }
    throw error;
  }
}

export async function translateWord(
  word: string,
  targetLanguage: string
): Promise<{ translatedText: string; fromCache: boolean }> {
  // Clean the word (remove punctuation at boundaries)
  const cleanWord = word.replace(/^[^\w\u00C0-\u024F]+|[^\w\u00C0-\u024F]+$/g, '');
  if (!cleanWord) {
    return { translatedText: word, fromCache: true };
  }
  return translateText(cleanWord, targetLanguage);
}
