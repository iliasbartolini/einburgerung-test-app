import { getDatabase } from '../database';
import type { TranslationCacheEntry } from '../../types';

export async function getCachedTranslation(
  sourceText: string,
  targetLanguage: string
): Promise<TranslationCacheEntry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<TranslationCacheEntry>(
    'SELECT * FROM translation_cache WHERE source_text = ? AND target_language = ?',
    [sourceText, targetLanguage]
  );
}

export async function cacheTranslation(
  sourceText: string,
  targetLanguage: string,
  translatedText: string,
  wordType?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO translation_cache (source_text, target_language, translated_text, word_type)
     VALUES (?, ?, ?, ?)`,
    [sourceText, targetLanguage, translatedText, wordType ?? null]
  );
}

export async function getCacheSize(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM translation_cache'
  );
  return result?.count ?? 0;
}

export async function clearTranslationCache(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM translation_cache');
}
