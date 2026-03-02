import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('einburgerung.db');
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    for (const sql of CREATE_TABLES_SQL) {
      await database.execAsync(sql);
    }
    for (const sql of CREATE_INDEXES_SQL) {
      await database.execAsync(sql);
    }
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

export async function seedQuestions(
  questions: Array<{
    id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    topic: string;
    bundesland_id: number | null;
    has_image: number;
    image_asset_path: string | null;
  }>
): Promise<void> {
  const database = await getDatabase();

  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM questions'
  );

  if (existing && existing.count > 0) return;

  await database.withTransactionAsync(async () => {
    for (const q of questions) {
      await database.runAsync(
        `INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_option, topic, bundesland_id, has_image, image_asset_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option,
          q.topic,
          q.bundesland_id,
          q.has_image,
          q.image_asset_path,
        ]
      );
    }
  });
}
