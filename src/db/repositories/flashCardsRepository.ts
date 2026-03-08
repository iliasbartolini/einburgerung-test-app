import { getDatabase } from '../database';
import type { FlashCard } from '../../types';

export async function isFlashCardSaved(germanWord: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM flash_cards WHERE german_word = ?',
    [germanWord]
  );
  return (result?.count ?? 0) > 0;
}

export async function saveFlashCard(
  germanWord: string,
  translatedText: string,
  targetLanguage: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO flash_cards (german_word, translated_text, target_language)
     VALUES (?, ?, ?)`,
    [germanWord, translatedText, targetLanguage]
  );
}

export async function removeFlashCard(cardId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM flash_cards WHERE id = ?', [cardId]);
}

export async function getFlashCardsForReview(targetLanguage: string): Promise<FlashCard[]> {
  const db = await getDatabase();
  const cards = await db.getAllAsync<FlashCard>(
    `SELECT *,
       CASE WHEN last_reviewed_at IS NULL THEN 0 ELSE 1 END AS has_been_reviewed,
       CASE WHEN (correct_count + wrong_count) = 0 THEN 1.0
            ELSE CAST(wrong_count AS REAL) / (correct_count + wrong_count)
       END AS failure_rate
     FROM flash_cards
     WHERE target_language = ?
     ORDER BY has_been_reviewed ASC, failure_rate DESC`,
    [targetLanguage]
  );

  if (cards.length === 0) return [];

  // Split into unpracticed and practiced, shuffle within each group
  const unpracticed = cards.filter(c => c.last_reviewed_at == null);
  const practiced = cards.filter(c => c.last_reviewed_at != null);

  return [...shuffle(unpracticed), ...shuffle(practiced)];
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function recordFlashCardReview(
  cardId: number,
  isCorrect: boolean
): Promise<void> {
  const db = await getDatabase();
  const column = isCorrect ? 'correct_count' : 'wrong_count';
  await db.runAsync(
    `UPDATE flash_cards
     SET ${column} = ${column} + 1,
         last_reviewed_at = datetime('now')
     WHERE id = ?`,
    [cardId]
  );
}

export async function getFlashCardCount(targetLanguage: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM flash_cards WHERE target_language = ?',
    [targetLanguage]
  );
  return result?.count ?? 0;
}

export async function getFlashCardByWord(germanWord: string): Promise<FlashCard | null> {
  const db = await getDatabase();
  return db.getFirstAsync<FlashCard>(
    'SELECT * FROM flash_cards WHERE german_word = ?',
    [germanWord]
  );
}
