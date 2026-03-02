import {
  getCachedTranslation,
  cacheTranslation,
} from '../db/repositories/translationRepository';

const API_BASE = 'https://translation.googleapis.com/language/translate/v2';

let apiKey: string | null = null;

export function setTranslationApiKey(key: string) {
  apiKey = key;
}

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

  // Call API if key is configured
  if (!apiKey) {
    throw new Error('TRANSLATION_UNAVAILABLE');
  }

  try {
    const response = await fetch(`${API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'de',
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error('TRANSLATION_API_ERROR');
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;

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
