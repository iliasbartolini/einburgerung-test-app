import { getDatabase } from '../database';
import type { ExamSession, Question } from '../../types';

export async function createExamSession(bundeslandId: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO exam_sessions (started_at, bundesland_id) VALUES (datetime('now'), ?)`,
    [bundeslandId]
  );
  return result.lastInsertRowId;
}

export async function completeExamSession(
  sessionId: number,
  score: number,
  timeTakenSeconds: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE exam_sessions SET
      completed_at = datetime('now'),
      score = ?,
      passed = ?,
      time_taken_seconds = ?
    WHERE id = ?`,
    [score, score >= 17 ? 1 : 0, timeTakenSeconds, sessionId]
  );
}

export async function getExamSession(id: number): Promise<ExamSession | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ExamSession>(
    'SELECT * FROM exam_sessions WHERE id = ?',
    [id]
  );
}

export async function getExamHistory(): Promise<ExamSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExamSession>(
    'SELECT * FROM exam_sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC'
  );
}

export async function generateExamQuestions(bundeslandId: number): Promise<Question[]> {
  const db = await getDatabase();

  // 30 random general questions
  const general = await db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE bundesland_id IS NULL ORDER BY RANDOM() LIMIT 30'
  );

  // 3 random state-specific questions
  const state = await db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE bundesland_id = ? ORDER BY RANDOM() LIMIT 3',
    [bundeslandId]
  );

  return [...general, ...state];
}

export async function clearExamHistory(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exam_sessions');
}
