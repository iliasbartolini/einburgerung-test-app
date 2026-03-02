import { getDatabase } from '../database';
import type { Question, QuestionStats } from '../../types';

export async function getQuestionById(id: number): Promise<Question | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Question>('SELECT * FROM questions WHERE id = ?', [id]);
}

export async function getQuestionsByBundesland(bundeslandId: number): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE bundesland_id IS NULL OR bundesland_id = ? ORDER BY id',
    [bundeslandId]
  );
}

export async function getGeneralQuestions(): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE bundesland_id IS NULL ORDER BY id'
  );
}

export async function getLandQuestions(bundeslandId: number): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE bundesland_id = ? ORDER BY id',
    [bundeslandId]
  );
}

export async function getQuestionsByTopic(topic: string): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE topic = ? ORDER BY id',
    [topic]
  );
}

export async function searchQuestions(query: string): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE question_text LIKE ? ORDER BY id',
    [`%${query}%`]
  );
}

export async function getQuestionStats(questionId: number): Promise<QuestionStats | null> {
  const db = await getDatabase();
  return db.getFirstAsync<QuestionStats>(
    'SELECT * FROM question_stats WHERE question_id = ?',
    [questionId]
  );
}

export async function getAllQuestionStats(): Promise<QuestionStats[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuestionStats>('SELECT * FROM question_stats');
}

export async function getIncorrectQuestions(bundeslandId: number): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    `SELECT DISTINCT q.* FROM questions q
     INNER JOIN question_attempts qa ON q.id = qa.question_id
     WHERE qa.is_correct = 0
     AND (q.bundesland_id IS NULL OR q.bundesland_id = ?)
     AND q.id NOT IN (
       SELECT qa2.question_id FROM question_attempts qa2
       WHERE qa2.is_correct = 1 AND qa2.mode = 'review'
     )
     ORDER BY q.id`,
    [bundeslandId]
  );
}

export async function getUnansweredQuestions(bundeslandId: number): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    `SELECT q.* FROM questions q
     WHERE q.id NOT IN (SELECT DISTINCT question_id FROM question_attempts)
     AND (q.bundesland_id IS NULL OR q.bundesland_id = ?)
     ORDER BY q.id`,
    [bundeslandId]
  );
}

export async function getBookmarkedQuestions(): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    `SELECT q.* FROM questions q
     INNER JOIN bookmarks b ON q.id = b.question_id
     ORDER BY q.id`
  );
}

export async function getQuestionCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM questions'
  );
  return result?.count ?? 0;
}
