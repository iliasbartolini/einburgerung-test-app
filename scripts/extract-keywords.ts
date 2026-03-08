/**
 * Extract German keywords from questions and generate a keyword dictionary.
 * Run with: npx tsx scripts/extract-keywords.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface KeywordEntry {
  term: string;
  category: 'institution' | 'place' | 'person' | 'event' | 'concept';
  wikipedia: string | null;
}

// Curated keyword list with Wikipedia slugs (German Wikipedia article names)
// Wikipedia slug is null when no specific article exists (will use Ecosia search)
const KEYWORDS: KeywordEntry[] = [
  // === INSTITUTIONS ===
  { term: 'Bundestag', category: 'institution', wikipedia: 'Deutscher_Bundestag' },
  { term: 'Bundesrat', category: 'institution', wikipedia: 'Bundesrat_(Deutschland)' },
  { term: 'Bundesregierung', category: 'institution', wikipedia: 'Bundesregierung_(Deutschland)' },
  { term: 'Bundespräsident', category: 'institution', wikipedia: 'Bundespräsident_(Deutschland)' },
  { term: 'Bundeskanzler', category: 'institution', wikipedia: 'Bundeskanzler_(Deutschland)' },
  { term: 'Bundeskanzlerin', category: 'institution', wikipedia: 'Bundeskanzler_(Deutschland)' },
  { term: 'Bundesverfassungsgericht', category: 'institution', wikipedia: 'Bundesverfassungsgericht' },
  { term: 'Bundesversammlung', category: 'institution', wikipedia: 'Bundesversammlung_(Deutschland)' },
  { term: 'Europäische Union', category: 'institution', wikipedia: 'Europäische_Union' },
  { term: 'Europäisches Parlament', category: 'institution', wikipedia: 'Europäisches_Parlament' },
  { term: 'Europäischen Union', category: 'institution', wikipedia: 'Europäische_Union' },
  { term: 'Vereinten Nationen', category: 'institution', wikipedia: 'Vereinte_Nationen' },
  { term: 'NATO', category: 'institution', wikipedia: 'NATO' },
  { term: 'Warschauer Pakt', category: 'institution', wikipedia: 'Warschauer_Pakt' },
  { term: 'Stasi', category: 'institution', wikipedia: 'Ministerium_für_Staatssicherheit' },
  { term: 'Landtag', category: 'institution', wikipedia: 'Landtag' },
  { term: 'Bundeswehr', category: 'institution', wikipedia: 'Bundeswehr' },
  { term: 'Petitionsausschuss', category: 'institution', wikipedia: 'Petitionsausschuss' },
  { term: 'Volkskammer', category: 'institution', wikipedia: 'Volkskammer' },

  // Political parties
  { term: 'CDU', category: 'institution', wikipedia: 'Christlich_Demokratische_Union_Deutschlands' },
  { term: 'CSU', category: 'institution', wikipedia: 'Christlich-Soziale_Union_in_Bayern' },
  { term: 'SPD', category: 'institution', wikipedia: 'Sozialdemokratische_Partei_Deutschlands' },
  { term: 'FDP', category: 'institution', wikipedia: 'Freie_Demokratische_Partei' },
  { term: 'Bündnis 90/Die Grünen', category: 'institution', wikipedia: 'Bündnis_90/Die_Grünen' },
  { term: 'Die Linke', category: 'institution', wikipedia: 'Die_Linke' },

  // === PLACES - Bundesländer ===
  { term: 'Baden-Württemberg', category: 'place', wikipedia: 'Baden-Württemberg' },
  { term: 'Bayern', category: 'place', wikipedia: 'Bayern' },
  { term: 'Berlin', category: 'place', wikipedia: 'Berlin' },
  { term: 'Brandenburg', category: 'place', wikipedia: 'Brandenburg' },
  { term: 'Bremen', category: 'place', wikipedia: 'Freie_Hansestadt_Bremen' },
  { term: 'Hamburg', category: 'place', wikipedia: 'Hamburg' },
  { term: 'Hessen', category: 'place', wikipedia: 'Hessen' },
  { term: 'Mecklenburg-Vorpommern', category: 'place', wikipedia: 'Mecklenburg-Vorpommern' },
  { term: 'Niedersachsen', category: 'place', wikipedia: 'Niedersachsen' },
  { term: 'Nordrhein-Westfalen', category: 'place', wikipedia: 'Nordrhein-Westfalen' },
  { term: 'Rheinland-Pfalz', category: 'place', wikipedia: 'Rheinland-Pfalz' },
  { term: 'Saarland', category: 'place', wikipedia: 'Saarland' },
  { term: 'Sachsen', category: 'place', wikipedia: 'Sachsen' },
  { term: 'Sachsen-Anhalt', category: 'place', wikipedia: 'Sachsen-Anhalt' },
  { term: 'Schleswig-Holstein', category: 'place', wikipedia: 'Schleswig-Holstein' },
  { term: 'Thüringen', category: 'place', wikipedia: 'Thüringen' },

  // Cities
  { term: 'Bonn', category: 'place', wikipedia: 'Bonn' },
  { term: 'Weimar', category: 'place', wikipedia: 'Weimar' },
  { term: 'München', category: 'place', wikipedia: 'München' },
  { term: 'Stuttgart', category: 'place', wikipedia: 'Stuttgart' },
  { term: 'Heidelberg', category: 'place', wikipedia: 'Heidelberg' },
  { term: 'Karlsruhe', category: 'place', wikipedia: 'Karlsruhe' },
  { term: 'Mannheim', category: 'place', wikipedia: 'Mannheim' },
  { term: 'Freiburg', category: 'place', wikipedia: 'Freiburg_im_Breisgau' },
  { term: 'Dresden', category: 'place', wikipedia: 'Dresden' },
  { term: 'Leipzig', category: 'place', wikipedia: 'Leipzig' },
  { term: 'Frankfurt', category: 'place', wikipedia: 'Frankfurt_am_Main' },
  { term: 'Köln', category: 'place', wikipedia: 'Köln' },
  { term: 'Düsseldorf', category: 'place', wikipedia: 'Düsseldorf' },
  { term: 'Hannover', category: 'place', wikipedia: 'Hannover' },
  { term: 'Nürnberg', category: 'place', wikipedia: 'Nürnberg' },
  { term: 'Potsdam', category: 'place', wikipedia: 'Potsdam' },
  { term: 'Wiesbaden', category: 'place', wikipedia: 'Wiesbaden' },
  { term: 'Mainz', category: 'place', wikipedia: 'Mainz' },
  { term: 'Schwerin', category: 'place', wikipedia: 'Schwerin' },
  { term: 'Magdeburg', category: 'place', wikipedia: 'Magdeburg' },
  { term: 'Erfurt', category: 'place', wikipedia: 'Erfurt' },
  { term: 'Kiel', category: 'place', wikipedia: 'Kiel' },
  { term: 'Saarbrücken', category: 'place', wikipedia: 'Saarbrücken' },
  { term: 'Rostock', category: 'place', wikipedia: 'Rostock' },

  // === PEOPLE ===
  { term: 'Konrad Adenauer', category: 'person', wikipedia: 'Konrad_Adenauer' },
  { term: 'Willy Brandt', category: 'person', wikipedia: 'Willy_Brandt' },
  { term: 'Helmut Schmidt', category: 'person', wikipedia: 'Helmut_Schmidt' },
  { term: 'Helmut Kohl', category: 'person', wikipedia: 'Helmut_Kohl' },
  { term: 'Angela Merkel', category: 'person', wikipedia: 'Angela_Merkel' },
  { term: 'Gerhard Schröder', category: 'person', wikipedia: 'Gerhard_Schröder' },
  { term: 'Gustav Heinemann', category: 'person', wikipedia: 'Gustav_Heinemann' },
  { term: 'Theodor Heuss', category: 'person', wikipedia: 'Theodor_Heuss' },
  { term: 'Richard von Weizsäcker', category: 'person', wikipedia: 'Richard_von_Weizsäcker' },
  { term: 'Johannes Rau', category: 'person', wikipedia: 'Johannes_Rau' },
  { term: 'Frank-Walter Steinmeier', category: 'person', wikipedia: 'Frank-Walter_Steinmeier' },
  { term: 'Martin Luther', category: 'person', wikipedia: 'Martin_Luther' },
  { term: 'Otto von Bismarck', category: 'person', wikipedia: 'Otto_von_Bismarck' },
  { term: 'Adolf Hitler', category: 'person', wikipedia: 'Adolf_Hitler' },
  { term: 'Friedrich Ebert', category: 'person', wikipedia: 'Friedrich_Ebert' },
  { term: 'Karl Marx', category: 'person', wikipedia: 'Karl_Marx' },
  { term: 'Sophie Scholl', category: 'person', wikipedia: 'Sophie_Scholl' },
  { term: 'Ludwig Erhard', category: 'person', wikipedia: 'Ludwig_Erhard' },

  // === HISTORICAL EVENTS ===
  { term: 'Wiedervereinigung', category: 'event', wikipedia: 'Deutsche_Wiedervereinigung' },
  { term: 'Berliner Mauer', category: 'event', wikipedia: 'Berliner_Mauer' },
  { term: 'Mauerfall', category: 'event', wikipedia: 'Mauerfall' },
  { term: 'Weimarer Republik', category: 'event', wikipedia: 'Weimarer_Republik' },
  { term: 'Nationalsozialismus', category: 'event', wikipedia: 'Nationalsozialismus' },
  { term: 'Zweiter Weltkrieg', category: 'event', wikipedia: 'Zweiter_Weltkrieg' },
  { term: 'Erster Weltkrieg', category: 'event', wikipedia: 'Erster_Weltkrieg' },
  { term: 'Kalter Krieg', category: 'event', wikipedia: 'Kalter_Krieg' },
  { term: 'Kalten Krieg', category: 'event', wikipedia: 'Kalter_Krieg' },
  { term: 'Kalten Krieges', category: 'event', wikipedia: 'Kalter_Krieg' },
  { term: 'Holocaust', category: 'event', wikipedia: 'Holocaust' },
  { term: 'Reichspogromnacht', category: 'event', wikipedia: 'Novemberpogrome_1938' },
  { term: 'Nürnberger Prozesse', category: 'event', wikipedia: 'Nürnberger_Prozesse' },
  { term: 'Reformation', category: 'event', wikipedia: 'Reformation' },
  { term: 'Französische Revolution', category: 'event', wikipedia: 'Französische_Revolution' },
  { term: 'Aufklärung', category: 'event', wikipedia: 'Aufklärung' },
  { term: 'Montagsdemonstrationen', category: 'event', wikipedia: 'Montagsdemonstrationen_1989/1990' },
  { term: 'Montagsdemonstration', category: 'event', wikipedia: 'Montagsdemonstrationen_1989/1990' },
  { term: 'Luftbrücke', category: 'event', wikipedia: 'Berliner_Luftbrücke' },
  { term: 'Marshallplan', category: 'event', wikipedia: 'Marshallplan' },
  { term: 'Wirtschaftswunder', category: 'event', wikipedia: 'Wirtschaftswunder' },
  { term: 'Volksaufstand', category: 'event', wikipedia: 'Aufstand_vom_17._Juni_1953' },
  { term: 'Währungsreform', category: 'event', wikipedia: 'Währungsreform_1948_(Westdeutschland)' },

  // === CONCEPTS ===
  { term: 'Grundgesetz', category: 'concept', wikipedia: 'Grundgesetz_für_die_Bundesrepublik_Deutschland' },
  { term: 'Grundrechte', category: 'concept', wikipedia: 'Grundrechte_(Deutschland)' },
  { term: 'Meinungsfreiheit', category: 'concept', wikipedia: 'Meinungsfreiheit' },
  { term: 'Pressefreiheit', category: 'concept', wikipedia: 'Pressefreiheit' },
  { term: 'Religionsfreiheit', category: 'concept', wikipedia: 'Religionsfreiheit' },
  { term: 'Versammlungsfreiheit', category: 'concept', wikipedia: 'Versammlungsfreiheit' },
  { term: 'Menschenwürde', category: 'concept', wikipedia: 'Menschenwürde' },
  { term: 'Rechtsstaat', category: 'concept', wikipedia: 'Rechtsstaat' },
  { term: 'Demokratie', category: 'concept', wikipedia: 'Demokratie' },
  { term: 'Föderalismus', category: 'concept', wikipedia: 'Föderalismus_in_Deutschland' },
  { term: 'Gewaltenteilung', category: 'concept', wikipedia: 'Gewaltenteilung' },
  { term: 'Sozialstaat', category: 'concept', wikipedia: 'Sozialstaat' },
  { term: 'Bundesstaat', category: 'concept', wikipedia: 'Föderalismus_in_Deutschland' },
  { term: 'Koalition', category: 'concept', wikipedia: 'Koalition_(Politik)' },
  { term: 'Opposition', category: 'concept', wikipedia: 'Opposition_(Politik)' },
  { term: 'Fraktion', category: 'concept', wikipedia: 'Fraktion_(Politik)' },
  { term: 'Wahlrecht', category: 'concept', wikipedia: 'Wahlrecht' },
  { term: 'Soziale Marktwirtschaft', category: 'concept', wikipedia: 'Soziale_Marktwirtschaft' },
  { term: 'Planwirtschaft', category: 'concept', wikipedia: 'Planwirtschaft' },
  { term: 'Marktwirtschaft', category: 'concept', wikipedia: 'Marktwirtschaft' },
  { term: 'Kapitalismus', category: 'concept', wikipedia: 'Kapitalismus' },
  { term: 'Kommunismus', category: 'concept', wikipedia: 'Kommunismus' },
  { term: 'Sozialismus', category: 'concept', wikipedia: 'Sozialismus' },
  { term: 'Monarchie', category: 'concept', wikipedia: 'Monarchie' },
  { term: 'Republik', category: 'concept', wikipedia: 'Republik' },
  { term: 'Diktatur', category: 'concept', wikipedia: 'Diktatur' },
  { term: 'Asylrecht', category: 'concept', wikipedia: 'Asylrecht_(Deutschland)' },
  { term: 'Volkssouveränität', category: 'concept', wikipedia: 'Volkssouveränität' },
  { term: 'Gewerkschaft', category: 'concept', wikipedia: 'Gewerkschaft' },
  { term: 'Gewerkschaften', category: 'concept', wikipedia: 'Gewerkschaft' },
  { term: 'Tarifautonomie', category: 'concept', wikipedia: 'Tarifautonomie' },
  { term: 'Wappen', category: 'concept', wikipedia: 'Wappen_Deutschlands' },
  { term: 'Bundesadler', category: 'concept', wikipedia: 'Bundesadler' },
  { term: 'Deutsche Demokratische Republik', category: 'concept', wikipedia: 'Deutsche_Demokratische_Republik' },
  { term: 'DDR', category: 'concept', wikipedia: 'Deutsche_Demokratische_Republik' },
  { term: 'Bundesrepublik Deutschland', category: 'concept', wikipedia: 'Deutschland' },
  { term: 'Ermächtigungsgesetz', category: 'concept', wikipedia: 'Ermächtigungsgesetz_vom_24._März_1933' },
  { term: 'Gleichschaltung', category: 'concept', wikipedia: 'Gleichschaltung' },
  { term: 'Rentenversicherung', category: 'concept', wikipedia: 'Gesetzliche_Rentenversicherung_(Deutschland)' },
  { term: 'Krankenversicherung', category: 'concept', wikipedia: 'Krankenversicherung_in_Deutschland' },
  { term: 'Pflegeversicherung', category: 'concept', wikipedia: 'Pflegeversicherung_(Deutschland)' },
  { term: 'Arbeitslosenversicherung', category: 'concept', wikipedia: 'Arbeitslosenversicherung' },
  { term: 'Unfallversicherung', category: 'concept', wikipedia: 'Gesetzliche_Unfallversicherung' },
  { term: 'Sozialversicherung', category: 'concept', wikipedia: 'Sozialversicherung_(Deutschland)' },
  { term: 'Industrialisierung', category: 'concept', wikipedia: 'Industrialisierung' },
  { term: 'Ehrenamt', category: 'concept', wikipedia: 'Ehrenamt' },
];

function main() {
  const questionsPath = path.join(__dirname, '..', 'assets', 'data', 'questions.json');
  const outputPath = path.join(__dirname, '..', 'assets', 'data', 'keywords.json');

  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  // Collect all text from questions
  const allTexts = questions.flatMap(q => [
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
  ]);
  const combinedText = allTexts.join(' ');

  // Filter keywords to only those that actually appear in the questions
  const matchedKeywords: KeywordEntry[] = [];
  const unmatchedTerms: string[] = [];

  for (const keyword of KEYWORDS) {
    if (combinedText.includes(keyword.term)) {
      matchedKeywords.push(keyword);
    } else {
      unmatchedTerms.push(keyword.term);
    }
  }

  // Sort by term length descending (for greedy matching at runtime)
  matchedKeywords.sort((a, b) => b.term.length - a.term.length);

  // Write output
  const output = {
    version: 1,
    generated_at: new Date().toISOString(),
    keywords: matchedKeywords,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  // Stats
  console.log(`Total keywords defined: ${KEYWORDS.length}`);
  console.log(`Keywords found in questions: ${matchedKeywords.length}`);
  console.log(`Keywords not found: ${unmatchedTerms.length}`);

  if (unmatchedTerms.length > 0) {
    console.log('\nNot found in questions:');
    for (const term of unmatchedTerms) {
      console.log(`  - ${term}`);
    }
  }

  // Category breakdown
  const categories: Record<string, number> = {};
  for (const kw of matchedKeywords) {
    categories[kw.category] = (categories[kw.category] || 0) + 1;
  }
  console.log('\nCategories:', categories);

  console.log(`\nOutput written to assets/data/keywords.json`);
}

main();
