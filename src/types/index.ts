export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  topic: 'politik' | 'geschichte' | 'gesellschaft' | 'bundesland';
  bundesland_id: number | null;
  has_image: number;
  image_asset_path: string | null;
}

export interface QuestionStats {
  question_id: number;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
  difficulty_tier: 'unseen' | 'mastered' | 'comfortable' | 'struggling' | 'difficult';
  last_attempted_at: string | null;
}

export interface ExamSession {
  id: number;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total: number;
  passed: number | null;
  bundesland_id: number;
  time_taken_seconds: number | null;
}

export interface QuestionAttempt {
  id: number;
  question_id: number;
  selected_option: string;
  is_correct: number;
  mode: 'practice' | 'exam' | 'review' | 'spaced';
  exam_session_id: number | null;
  attempted_at: string;
}

export interface Bookmark {
  question_id: number;
  created_at: string;
}

export interface TranslationCacheEntry {
  id: number;
  source_text: string;
  target_language: string;
  translated_text: string;
  word_type: string | null;
  created_at: string;
}

export type PracticeMode = 'practice' | 'exam' | 'review';

export interface Bundesland {
  id: number;
  name: string;
  name_en: string;
}

export const BUNDESLAENDER: Bundesland[] = [
  { id: 1, name: 'Baden-Württemberg', name_en: 'Baden-Württemberg' },
  { id: 2, name: 'Bayern', name_en: 'Bavaria' },
  { id: 3, name: 'Berlin', name_en: 'Berlin' },
  { id: 4, name: 'Brandenburg', name_en: 'Brandenburg' },
  { id: 5, name: 'Bremen', name_en: 'Bremen' },
  { id: 6, name: 'Hamburg', name_en: 'Hamburg' },
  { id: 7, name: 'Hessen', name_en: 'Hessen' },
  { id: 8, name: 'Mecklenburg-Vorpommern', name_en: 'Mecklenburg-Vorpommern' },
  { id: 9, name: 'Niedersachsen', name_en: 'Lower Saxony' },
  { id: 10, name: 'Nordrhein-Westfalen', name_en: 'North Rhine-Westphalia' },
  { id: 11, name: 'Rheinland-Pfalz', name_en: 'Rhineland-Palatinate' },
  { id: 12, name: 'Saarland', name_en: 'Saarland' },
  { id: 13, name: 'Sachsen', name_en: 'Saxony' },
  { id: 14, name: 'Sachsen-Anhalt', name_en: 'Saxony-Anhalt' },
  { id: 15, name: 'Schleswig-Holstein', name_en: 'Schleswig-Holstein' },
  { id: 16, name: 'Thüringen', name_en: 'Thuringia' },
];
