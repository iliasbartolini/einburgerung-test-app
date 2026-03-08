import { getDatabase } from '../database';
import type { QuestionAttempt } from '../../types';

export async function recordAttempt(
  questionId: number,
  selectedOption: string,
  isCorrect: boolean,
  mode: string,
  examSessionId?: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO question_attempts (question_id, selected_option, is_correct, mode, exam_session_id)
     VALUES (?, ?, ?, ?, ?)`,
    [questionId, selectedOption, isCorrect ? 1 : 0, mode, examSessionId ?? null]
  );
}

export async function getAttemptsForQuestion(
  questionId: number
): Promise<QuestionAttempt[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuestionAttempt>(
    'SELECT * FROM question_attempts WHERE question_id = ? ORDER BY attempted_at DESC',
    [questionId]
  );
}

export async function getTotalAttempts(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM question_attempts'
  );
  return result?.count ?? 0;
}

export async function getCorrectAttempts(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM question_attempts WHERE is_correct = 1'
  );
  return result?.count ?? 0;
}

export async function getAttemptedQuestionCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT question_id) as count FROM question_attempts'
  );
  return result?.count ?? 0;
}

export async function recordExamAttempts(
  answers: { questionId: number; selectedOption: string; isCorrect: boolean }[],
  examSessionId: number
): Promise<void> {
  const db = await getDatabase();
  for (const a of answers) {
    await db.runAsync(
      `INSERT INTO question_attempts (question_id, selected_option, is_correct, mode, exam_session_id)
       VALUES (?, ?, ?, 'exam', ?)`,
      [a.questionId, a.selectedOption, a.isCorrect ? 1 : 0, examSessionId]
    );
  }
}

export async function clearAllAttempts(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM question_attempts');
}
