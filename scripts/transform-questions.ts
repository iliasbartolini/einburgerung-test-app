/**
 * Transform questions from questions-catalogue/ into the app's canonical format.
 * Run with: npx tsx scripts/transform-questions.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface SourceCommonQuestion {
  question_number: number;
  question: string;
  options: string[];
  answer: string;
  image?: string;
}

interface SourceLandQuestion {
  question_number: number;
  question: string;
  options: string[];
  answer: string;
  land: string;
  image?: string;
}

interface TransformedQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  topic: string;
  bundesland_id: number | null;
  has_image: number;
  image_asset_path: string | null;
}

const LAND_TO_ID: Record<string, number> = {
  'Baden-Württemberg': 1,
  'Bayern': 2,
  'Berlin': 3,
  'Brandenburg': 4,
  'Bremen': 5,
  'Hamburg': 6,
  'Hessen': 7,
  'Saarland': 8,
  'Mecklenburg-Vorpommern': 9,
  'Niedersachsen': 10,
  'Nordrhein-Westfalen': 11,
  'Rheinland-Pfalz': 12,
  'Sachsen': 13,
  'Sachsen-Anhalt': 14,
  'Schleswig-Holstein': 15,
  'Thüringen': 16,
};

function getTopicForQuestion(questionNumber: number): string {
  // Based on BAMF catalog structure:
  // 1-100: Politik in der Demokratie (Politics)
  // 101-200: Geschichte und Verantwortung (History)
  // 201-300: Mensch und Gesellschaft (Society)
  // 301-460: Bundesland-specific
  if (questionNumber <= 100) return 'politik';
  if (questionNumber <= 200) return 'geschichte';
  if (questionNumber <= 300) return 'gesellschaft';
  return 'bundesland';
}

function findCorrectOption(options: string[], answer: string): 'a' | 'b' | 'c' | 'd' {
  const letters: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  const index = options.findIndex((opt) => opt === answer);
  if (index === -1) {
    throw new Error(
      `Answer "${answer}" not found in options: ${JSON.stringify(options)}`
    );
  }
  return letters[index];
}

function main() {
  const catalogDir = path.join(__dirname, '..', 'questions-catalogue');
  const outputDir = path.join(__dirname, '..', 'assets', 'data');

  const commonRaw = fs.readFileSync(
    path.join(catalogDir, 'questions-common.json'),
    'utf-8'
  );
  const landRaw = fs.readFileSync(
    path.join(catalogDir, 'questions-lander-specific.json'),
    'utf-8'
  );

  const commonQuestions: SourceCommonQuestion[] = JSON.parse(commonRaw);
  const landQuestions: SourceLandQuestion[] = JSON.parse(landRaw);

  const transformed: TransformedQuestion[] = [];

  // Transform common questions (1-300)
  for (const q of commonQuestions) {
    transformed.push({
      id: q.question_number,
      question_text: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_option: findCorrectOption(q.options, q.answer),
      topic: getTopicForQuestion(q.question_number),
      bundesland_id: null,
      has_image: q.image ? 1 : 0,
      image_asset_path: q.image || null,
    });
  }

  // Transform land-specific questions (301-460)
  for (const q of landQuestions) {
    const bundeslandId = LAND_TO_ID[q.land];
    if (!bundeslandId) {
      throw new Error(`Unknown land: "${q.land}"`);
    }

    transformed.push({
      id: q.question_number,
      question_text: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_option: findCorrectOption(q.options, q.answer),
      topic: 'bundesland',
      bundesland_id: bundeslandId,
      has_image: q.image ? 1 : 0,
      image_asset_path: q.image || null,
    });
  }

  // Sort by ID
  transformed.sort((a, b) => a.id - b.id);

  // Validate
  console.log(`Total questions: ${transformed.length}`);
  console.log(`Common (1-300): ${transformed.filter((q) => q.id <= 300).length}`);
  console.log(`Land-specific (301-460): ${transformed.filter((q) => q.id > 300).length}`);
  console.log(`With images: ${transformed.filter((q) => q.has_image).length}`);

  const topics = transformed.reduce(
    (acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  console.log('Topics:', topics);

  // Write output
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'questions.json'),
    JSON.stringify(transformed, null, 2)
  );

  console.log(`\nOutput written to assets/data/questions.json`);
}

main();
