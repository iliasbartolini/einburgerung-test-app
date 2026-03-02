import { getDatabase } from '../database';

export async function isBookmarked(questionId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ question_id: number }>(
    'SELECT question_id FROM bookmarks WHERE question_id = ?',
    [questionId]
  );
  return !!row;
}

export async function toggleBookmark(questionId: number): Promise<boolean> {
  const db = await getDatabase();
  const exists = await isBookmarked(questionId);
  if (exists) {
    await db.runAsync('DELETE FROM bookmarks WHERE question_id = ?', [questionId]);
    return false;
  } else {
    await db.runAsync('INSERT INTO bookmarks (question_id) VALUES (?)', [questionId]);
    return true;
  }
}

export async function getBookmarkedIds(): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ question_id: number }>(
    'SELECT question_id FROM bookmarks ORDER BY question_id'
  );
  return rows.map((r) => r.question_id);
}
