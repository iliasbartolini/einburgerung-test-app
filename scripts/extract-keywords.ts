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
  category: 'institution' | 'place' | 'person' | 'event' | 'concept' | 'party';
  wikipedia_slugs: Record<string, string>;
}

// Helper: most keywords share the same slug across all Wikipedias (proper nouns, place names).
// Use `w()` for those and spell out per-language slugs only when they differ.
function w(deSlug: string, overrides?: Record<string, string>): Record<string, string> {
  return { de: deSlug, ...overrides };
}

// Curated keyword list with per-language Wikipedia slugs.
// `de` is always required. Add other languages only when the slug differs from `de`.
const KEYWORDS: KeywordEntry[] = [
  // === INSTITUTIONS ===
  { term: 'Bundestag', category: 'institution', wikipedia_slugs: w('Deutscher_Bundestag', { en: 'Bundestag' }) },
  { term: 'Bundesrat', category: 'institution', wikipedia_slugs: w('Bundesrat_(Deutschland)', { en: 'German_Bundesrat' }) },
  { term: 'Bundesregierung', category: 'institution', wikipedia_slugs: w('Bundesregierung_(Deutschland)', { en: 'Government_of_Germany' }) },
  { term: 'Bundespräsident', category: 'institution', wikipedia_slugs: w('Bundespräsident_(Deutschland)', { en: 'President_of_Germany' }) },
  { term: 'Bundeskanzler', category: 'institution', wikipedia_slugs: w('Bundeskanzler_(Deutschland)', { en: 'Chancellor_of_Germany' }) },
  { term: 'Bundeskanzlerin', category: 'institution', wikipedia_slugs: w('Bundeskanzler_(Deutschland)', { en: 'Chancellor_of_Germany' }) },
  { term: 'Bundesverfassungsgericht', category: 'institution', wikipedia_slugs: w('Bundesverfassungsgericht', { en: 'Federal_Constitutional_Court' }) },
  { term: 'Bundesversammlung', category: 'institution', wikipedia_slugs: w('Bundesversammlung_(Deutschland)', { en: 'Federal_Convention_(Germany)' }) },
  { term: 'Europäische Union', category: 'institution', wikipedia_slugs: w('Europäische_Union', { en: 'European_Union' }) },
  { term: 'Europäisches Parlament', category: 'institution', wikipedia_slugs: w('Europäisches_Parlament', { en: 'European_Parliament' }) },
  { term: 'Europäischen Union', category: 'institution', wikipedia_slugs: w('Europäische_Union', { en: 'European_Union' }) },
  { term: 'Vereinten Nationen', category: 'institution', wikipedia_slugs: w('Vereinte_Nationen', { en: 'United_Nations' }) },
  { term: 'NATO', category: 'institution', wikipedia_slugs: w('NATO') },
  { term: 'Warschauer Pakt', category: 'institution', wikipedia_slugs: w('Warschauer_Pakt', { en: 'Warsaw_Pact' }) },
  { term: 'Stasi', category: 'institution', wikipedia_slugs: w('Ministerium_für_Staatssicherheit', { en: 'Stasi' }) },
  { term: 'Landtag', category: 'institution', wikipedia_slugs: w('Landtag') },
  { term: 'Bundeswehr', category: 'institution', wikipedia_slugs: w('Bundeswehr') },
  { term: 'Petitionsausschuss', category: 'institution', wikipedia_slugs: w('Petitionsausschuss', { en: 'Petitions_Committee_(Germany)' }) },
  { term: 'Volkskammer', category: 'institution', wikipedia_slugs: w('Volkskammer') },

  // Political parties
  { term: 'CDU', category: 'party', wikipedia_slugs: w('Christlich_Demokratische_Union_Deutschlands', { en: 'Christian_Democratic_Union_of_Germany' }) },
  { term: 'CSU', category: 'party', wikipedia_slugs: w('Christlich-Soziale_Union_in_Bayern', { en: 'Christian_Social_Union_in_Bavaria' }) },
  { term: 'SPD', category: 'party', wikipedia_slugs: w('Sozialdemokratische_Partei_Deutschlands', { en: 'Social_Democratic_Party_of_Germany' }) },
  { term: 'FDP', category: 'party', wikipedia_slugs: w('Freie_Demokratische_Partei', { en: 'Free_Democratic_Party_(Germany)' }) },
  { term: 'Bündnis 90/Die Grünen', category: 'party', wikipedia_slugs: w('Bündnis_90/Die_Grünen', { en: 'Alliance_90/The_Greens' }) },
  { term: 'Die Linke', category: 'party', wikipedia_slugs: w('Die_Linke', { en: 'The_Left_(Germany)' }) },

  // === PLACES - Bundesländer ===
  { term: 'Baden-Württemberg', category: 'place', wikipedia_slugs: w('Baden-Württemberg') },
  { term: 'Bayern', category: 'place', wikipedia_slugs: w('Bayern', { en: 'Bavaria' }) },
  { term: 'Berlin', category: 'place', wikipedia_slugs: w('Berlin') },
  { term: 'Brandenburg', category: 'place', wikipedia_slugs: w('Brandenburg') },
  { term: 'Bremen', category: 'place', wikipedia_slugs: w('Freie_Hansestadt_Bremen', { en: 'Bremen_(state)' }) },
  { term: 'Hamburg', category: 'place', wikipedia_slugs: w('Hamburg') },
  { term: 'Hessen', category: 'place', wikipedia_slugs: w('Hessen', { en: 'Hesse' }) },
  { term: 'Mecklenburg-Vorpommern', category: 'place', wikipedia_slugs: w('Mecklenburg-Vorpommern') },
  { term: 'Niedersachsen', category: 'place', wikipedia_slugs: w('Niedersachsen', { en: 'Lower_Saxony' }) },
  { term: 'Nordrhein-Westfalen', category: 'place', wikipedia_slugs: w('Nordrhein-Westfalen', { en: 'North_Rhine-Westphalia' }) },
  { term: 'Rheinland-Pfalz', category: 'place', wikipedia_slugs: w('Rheinland-Pfalz', { en: 'Rhineland-Palatinate' }) },
  { term: 'Saarland', category: 'place', wikipedia_slugs: w('Saarland') },
  { term: 'Sachsen', category: 'place', wikipedia_slugs: w('Sachsen', { en: 'Saxony' }) },
  { term: 'Sachsen-Anhalt', category: 'place', wikipedia_slugs: w('Sachsen-Anhalt', { en: 'Saxony-Anhalt' }) },
  { term: 'Schleswig-Holstein', category: 'place', wikipedia_slugs: w('Schleswig-Holstein') },
  { term: 'Thüringen', category: 'place', wikipedia_slugs: w('Thüringen', { en: 'Thuringia' }) },

  // Cities
  { term: 'Bonn', category: 'place', wikipedia_slugs: w('Bonn') },
  { term: 'Weimar', category: 'place', wikipedia_slugs: w('Weimar') },
  { term: 'München', category: 'place', wikipedia_slugs: w('München', { en: 'Munich' }) },
  { term: 'Stuttgart', category: 'place', wikipedia_slugs: w('Stuttgart') },
  { term: 'Heidelberg', category: 'place', wikipedia_slugs: w('Heidelberg') },
  { term: 'Karlsruhe', category: 'place', wikipedia_slugs: w('Karlsruhe') },
  { term: 'Mannheim', category: 'place', wikipedia_slugs: w('Mannheim') },
  { term: 'Freiburg', category: 'place', wikipedia_slugs: w('Freiburg_im_Breisgau', { en: 'Freiburg_im_Breisgau' }) },
  { term: 'Dresden', category: 'place', wikipedia_slugs: w('Dresden') },
  { term: 'Leipzig', category: 'place', wikipedia_slugs: w('Leipzig') },
  { term: 'Frankfurt', category: 'place', wikipedia_slugs: w('Frankfurt_am_Main') },
  { term: 'Köln', category: 'place', wikipedia_slugs: w('Köln', { en: 'Cologne' }) },
  { term: 'Düsseldorf', category: 'place', wikipedia_slugs: w('Düsseldorf') },
  { term: 'Hannover', category: 'place', wikipedia_slugs: w('Hannover', { en: 'Hanover' }) },
  { term: 'Nürnberg', category: 'place', wikipedia_slugs: w('Nürnberg', { en: 'Nuremberg' }) },
  { term: 'Potsdam', category: 'place', wikipedia_slugs: w('Potsdam') },
  { term: 'Wiesbaden', category: 'place', wikipedia_slugs: w('Wiesbaden') },
  { term: 'Mainz', category: 'place', wikipedia_slugs: w('Mainz') },
  { term: 'Schwerin', category: 'place', wikipedia_slugs: w('Schwerin') },
  { term: 'Magdeburg', category: 'place', wikipedia_slugs: w('Magdeburg') },
  { term: 'Erfurt', category: 'place', wikipedia_slugs: w('Erfurt') },
  { term: 'Kiel', category: 'place', wikipedia_slugs: w('Kiel') },
  { term: 'Saarbrücken', category: 'place', wikipedia_slugs: w('Saarbrücken') },
  { term: 'Rostock', category: 'place', wikipedia_slugs: w('Rostock') },

  // === PEOPLE ===
  { term: 'Konrad Adenauer', category: 'person', wikipedia_slugs: w('Konrad_Adenauer') },
  { term: 'Willy Brandt', category: 'person', wikipedia_slugs: w('Willy_Brandt') },
  { term: 'Helmut Schmidt', category: 'person', wikipedia_slugs: w('Helmut_Schmidt') },
  { term: 'Helmut Kohl', category: 'person', wikipedia_slugs: w('Helmut_Kohl') },
  { term: 'Angela Merkel', category: 'person', wikipedia_slugs: w('Angela_Merkel') },
  { term: 'Gerhard Schröder', category: 'person', wikipedia_slugs: w('Gerhard_Schröder') },
  { term: 'Gustav Heinemann', category: 'person', wikipedia_slugs: w('Gustav_Heinemann') },
  { term: 'Theodor Heuss', category: 'person', wikipedia_slugs: w('Theodor_Heuss') },
  { term: 'Richard von Weizsäcker', category: 'person', wikipedia_slugs: w('Richard_von_Weizsäcker') },
  { term: 'Johannes Rau', category: 'person', wikipedia_slugs: w('Johannes_Rau') },
  { term: 'Frank-Walter Steinmeier', category: 'person', wikipedia_slugs: w('Frank-Walter_Steinmeier') },
  { term: 'Martin Luther', category: 'person', wikipedia_slugs: w('Martin_Luther') },
  { term: 'Otto von Bismarck', category: 'person', wikipedia_slugs: w('Otto_von_Bismarck') },
  { term: 'Adolf Hitler', category: 'person', wikipedia_slugs: w('Adolf_Hitler') },
  { term: 'Friedrich Ebert', category: 'person', wikipedia_slugs: w('Friedrich_Ebert') },
  { term: 'Karl Marx', category: 'person', wikipedia_slugs: w('Karl_Marx') },
  { term: 'Sophie Scholl', category: 'person', wikipedia_slugs: w('Sophie_Scholl') },
  { term: 'Ludwig Erhard', category: 'person', wikipedia_slugs: w('Ludwig_Erhard') },

  // === HISTORICAL EVENTS ===
  { term: 'Wiedervereinigung', category: 'event', wikipedia_slugs: w('Deutsche_Wiedervereinigung', { en: 'German_reunification' }) },
  { term: 'Berliner Mauer', category: 'event', wikipedia_slugs: w('Berliner_Mauer', { en: 'Berlin_Wall' }) },
  { term: 'Mauerfall', category: 'event', wikipedia_slugs: w('Mauerfall', { en: 'Fall_of_the_Berlin_Wall' }) },
  { term: 'Weimarer Republik', category: 'event', wikipedia_slugs: w('Weimarer_Republik', { en: 'Weimar_Republic' }) },
  { term: 'Nationalsozialismus', category: 'event', wikipedia_slugs: w('Nationalsozialismus', { en: 'Nazism' }) },
  { term: 'Zweiter Weltkrieg', category: 'event', wikipedia_slugs: w('Zweiter_Weltkrieg', { en: 'World_War_II' }) },
  { term: 'Erster Weltkrieg', category: 'event', wikipedia_slugs: w('Erster_Weltkrieg', { en: 'World_War_I' }) },
  { term: 'Kalter Krieg', category: 'event', wikipedia_slugs: w('Kalter_Krieg', { en: 'Cold_War' }) },
  { term: 'Kalten Krieg', category: 'event', wikipedia_slugs: w('Kalter_Krieg', { en: 'Cold_War' }) },
  { term: 'Kalten Krieges', category: 'event', wikipedia_slugs: w('Kalter_Krieg', { en: 'Cold_War' }) },
  { term: 'Holocaust', category: 'event', wikipedia_slugs: w('Holocaust', { en: 'The_Holocaust' }) },
  { term: 'Reichspogromnacht', category: 'event', wikipedia_slugs: w('Novemberpogrome_1938', { en: 'Kristallnacht' }) },
  { term: 'Nürnberger Prozesse', category: 'event', wikipedia_slugs: w('Nürnberger_Prozesse', { en: 'Nuremberg_trials' }) },
  { term: 'Reformation', category: 'event', wikipedia_slugs: w('Reformation') },
  { term: 'Französische Revolution', category: 'event', wikipedia_slugs: w('Französische_Revolution', { en: 'French_Revolution' }) },
  { term: 'Aufklärung', category: 'event', wikipedia_slugs: w('Aufklärung', { en: 'Age_of_Enlightenment' }) },
  { term: 'Montagsdemonstrationen', category: 'event', wikipedia_slugs: w('Montagsdemonstrationen_1989/1990', { en: 'Monday_demonstrations_in_East_Germany' }) },
  { term: 'Montagsdemonstration', category: 'event', wikipedia_slugs: w('Montagsdemonstrationen_1989/1990', { en: 'Monday_demonstrations_in_East_Germany' }) },
  { term: 'Luftbrücke', category: 'event', wikipedia_slugs: w('Berliner_Luftbrücke', { en: 'Berlin_Blockade' }) },
  { term: 'Marshallplan', category: 'event', wikipedia_slugs: w('Marshallplan', { en: 'Marshall_Plan' }) },
  { term: 'Wirtschaftswunder', category: 'event', wikipedia_slugs: w('Wirtschaftswunder') },
  { term: 'Volksaufstand', category: 'event', wikipedia_slugs: w('Aufstand_vom_17._Juni_1953', { en: 'East_German_uprising_of_1953' }) },
  { term: 'Währungsreform', category: 'event', wikipedia_slugs: w('Währungsreform_1948_(Westdeutschland)', { en: 'Deutsche_Mark' }) },

  // === CONCEPTS ===
  { term: 'Grundgesetz', category: 'concept', wikipedia_slugs: w('Grundgesetz_für_die_Bundesrepublik_Deutschland', { en: 'Basic_Law_for_the_Federal_Republic_of_Germany' }) },
  { term: 'Grundrechte', category: 'concept', wikipedia_slugs: w('Grundrechte_(Deutschland)', { en: 'Fundamental_rights_in_Germany' }) },
  { term: 'Meinungsfreiheit', category: 'concept', wikipedia_slugs: w('Meinungsfreiheit', { en: 'Freedom_of_speech' }) },
  { term: 'Pressefreiheit', category: 'concept', wikipedia_slugs: w('Pressefreiheit', { en: 'Freedom_of_the_press' }) },
  { term: 'Religionsfreiheit', category: 'concept', wikipedia_slugs: w('Religionsfreiheit', { en: 'Freedom_of_religion' }) },
  { term: 'Versammlungsfreiheit', category: 'concept', wikipedia_slugs: w('Versammlungsfreiheit', { en: 'Freedom_of_assembly' }) },
  { term: 'Menschenwürde', category: 'concept', wikipedia_slugs: w('Menschenwürde', { en: 'Human_dignity' }) },
  { term: 'Rechtsstaat', category: 'concept', wikipedia_slugs: w('Rechtsstaat', { en: 'Rule_of_law' }) },
  { term: 'Demokratie', category: 'concept', wikipedia_slugs: w('Demokratie', { en: 'Democracy' }) },
  { term: 'Föderalismus', category: 'concept', wikipedia_slugs: w('Föderalismus_in_Deutschland', { en: 'Federalism_in_Germany' }) },
  { term: 'Gewaltenteilung', category: 'concept', wikipedia_slugs: w('Gewaltenteilung', { en: 'Separation_of_powers' }) },
  { term: 'Sozialstaat', category: 'concept', wikipedia_slugs: w('Sozialstaat', { en: 'Welfare_state' }) },
  { term: 'Bundesstaat', category: 'concept', wikipedia_slugs: w('Föderalismus_in_Deutschland', { en: 'Federalism_in_Germany' }) },
  { term: 'Koalition', category: 'concept', wikipedia_slugs: w('Koalition_(Politik)', { en: 'Coalition_government' }) },
  { term: 'Opposition', category: 'concept', wikipedia_slugs: w('Opposition_(Politik)', { en: 'Opposition_(politics)' }) },
  { term: 'Fraktion', category: 'concept', wikipedia_slugs: w('Fraktion_(Politik)', { en: 'Parliamentary_group' }) },
  { term: 'Wahlrecht', category: 'concept', wikipedia_slugs: w('Wahlrecht', { en: 'Suffrage' }) },
  { term: 'Soziale Marktwirtschaft', category: 'concept', wikipedia_slugs: w('Soziale_Marktwirtschaft', { en: 'Social_market_economy' }) },
  { term: 'Planwirtschaft', category: 'concept', wikipedia_slugs: w('Planwirtschaft', { en: 'Planned_economy' }) },
  { term: 'Marktwirtschaft', category: 'concept', wikipedia_slugs: w('Marktwirtschaft', { en: 'Market_economy' }) },
  { term: 'Kapitalismus', category: 'concept', wikipedia_slugs: w('Kapitalismus', { en: 'Capitalism' }) },
  { term: 'Kommunismus', category: 'concept', wikipedia_slugs: w('Kommunismus', { en: 'Communism' }) },
  { term: 'Sozialismus', category: 'concept', wikipedia_slugs: w('Sozialismus', { en: 'Socialism' }) },
  { term: 'Monarchie', category: 'concept', wikipedia_slugs: w('Monarchie', { en: 'Monarchy' }) },
  { term: 'Republik', category: 'concept', wikipedia_slugs: w('Republik', { en: 'Republic' }) },
  { term: 'Diktatur', category: 'concept', wikipedia_slugs: w('Diktatur', { en: 'Dictatorship' }) },
  { term: 'Asylrecht', category: 'concept', wikipedia_slugs: w('Asylrecht_(Deutschland)', { en: 'Right_of_asylum' }) },
  { term: 'Volkssouveränität', category: 'concept', wikipedia_slugs: w('Volkssouveränität', { en: 'Popular_sovereignty' }) },
  { term: 'Gewerkschaft', category: 'concept', wikipedia_slugs: w('Gewerkschaft', { en: 'Trade_union' }) },
  { term: 'Gewerkschaften', category: 'concept', wikipedia_slugs: w('Gewerkschaft', { en: 'Trade_union' }) },
  { term: 'Tarifautonomie', category: 'concept', wikipedia_slugs: w('Tarifautonomie', { en: 'Collective_bargaining' }) },
  { term: 'Wappen', category: 'concept', wikipedia_slugs: w('Wappen_Deutschlands', { en: 'Coat_of_arms_of_Germany' }) },
  { term: 'Bundesadler', category: 'concept', wikipedia_slugs: w('Bundesadler', { en: 'Coat_of_arms_of_Germany' }) },
  { term: 'Deutsche Demokratische Republik', category: 'concept', wikipedia_slugs: w('Deutsche_Demokratische_Republik', { en: 'East_Germany' }) },
  { term: 'DDR', category: 'concept', wikipedia_slugs: w('Deutsche_Demokratische_Republik', { en: 'East_Germany' }) },
  { term: 'Bundesrepublik Deutschland', category: 'concept', wikipedia_slugs: w('Deutschland', { en: 'Germany' }) },
  { term: 'Ermächtigungsgesetz', category: 'concept', wikipedia_slugs: w('Ermächtigungsgesetz_vom_24._März_1933', { en: 'Enabling_Act_of_1933' }) },
  { term: 'Gleichschaltung', category: 'concept', wikipedia_slugs: w('Gleichschaltung') },
  { term: 'Rentenversicherung', category: 'concept', wikipedia_slugs: w('Gesetzliche_Rentenversicherung_(Deutschland)', { en: 'Pensions_in_Germany' }) },
  { term: 'Krankenversicherung', category: 'concept', wikipedia_slugs: w('Krankenversicherung_in_Deutschland', { en: 'Healthcare_in_Germany' }) },
  { term: 'Pflegeversicherung', category: 'concept', wikipedia_slugs: w('Pflegeversicherung_(Deutschland)', { en: 'Long-term_care_insurance' }) },
  { term: 'Arbeitslosenversicherung', category: 'concept', wikipedia_slugs: w('Arbeitslosenversicherung', { en: 'Unemployment_insurance' }) },
  { term: 'Unfallversicherung', category: 'concept', wikipedia_slugs: w('Gesetzliche_Unfallversicherung', { en: 'Accident_insurance' }) },
  { term: 'Sozialversicherung', category: 'concept', wikipedia_slugs: w('Sozialversicherung_(Deutschland)', { en: 'Social_security_in_Germany' }) },
  { term: 'Industrialisierung', category: 'concept', wikipedia_slugs: w('Industrialisierung', { en: 'Industrialisation' }) },
  { term: 'Ehrenamt', category: 'concept', wikipedia_slugs: w('Ehrenamt', { en: 'Volunteering' }) },
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
    version: 2,
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
