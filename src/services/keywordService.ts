import keywordsData from '../../assets/data/keywords.json';

export interface KeywordEntry {
  term: string;
  category: 'institution' | 'place' | 'person' | 'event' | 'concept' | 'party';
  wikipedia_slugs: Record<string, string>;
}

export interface KeywordMatch {
  term: string;
  start: number;
  end: number;
}

interface KeywordDictionary {
  version: number;
  keywords: KeywordEntry[];
}

// Loaded once at import time — dictionary is a small static asset
const dictionary = keywordsData as KeywordDictionary;

// Build lookup map (lowercase term → entry) for single-word lookups
const lookupMap = new Map<string, KeywordEntry>();
for (const entry of dictionary.keywords) {
  lookupMap.set(entry.term.toLowerCase(), entry);
}

// Keywords sorted by length descending for greedy matching
const sortedKeywords = [...dictionary.keywords].sort(
  (a, b) => b.term.length - a.term.length
);

export function getKeywordInfo(word: string): KeywordEntry | null {
  // Clean punctuation from boundaries
  const cleaned = word.replace(/^[^\w\u00C0-\u024F]+|[^\w\u00C0-\u024F]+$/g, '');
  return lookupMap.get(cleaned.toLowerCase()) ?? lookupMap.get(cleaned) ?? null;
}

export function findKeywordsInText(text: string): KeywordMatch[] {
  const matches: KeywordMatch[] = [];
  const used = new Array(text.length).fill(false);

  // Greedy: match longest keywords first
  for (const entry of sortedKeywords) {
    let searchFrom = 0;
    while (searchFrom < text.length) {
      const idx = text.indexOf(entry.term, searchFrom);
      if (idx === -1) break;

      const end = idx + entry.term.length;

      // Check that this range isn't already covered
      let overlaps = false;
      for (let i = idx; i < end; i++) {
        if (used[i]) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        // Check word boundaries (avoid matching inside other words)
        const charBefore = idx > 0 ? text[idx - 1] : ' ';
        const charAfter = end < text.length ? text[end] : ' ';
        const isBoundaryBefore = /[\s,;:.!?()/"„"\-–—]/.test(charBefore);
        const isBoundaryAfter = /[\s,;:.!?()/"„"\-–—]/.test(charAfter);

        if (isBoundaryBefore && isBoundaryAfter) {
          matches.push({ term: entry.term, start: idx, end });
          for (let i = idx; i < end; i++) used[i] = true;
        }
      }

      searchFrom = idx + 1;
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

/**
 * Get the Wikipedia URL for a keyword in a specific language.
 * Uses the language-specific slug if available, falls back to the German slug.
 */
export function getWikipediaUrl(slugs: Record<string, string>, lang: string): string {
  const slug = slugs[lang] ?? slugs.de;
  const wikiLang = slug === slugs.de ? 'de' : lang;
  return `https://${wikiLang}.wikipedia.org/wiki/${slug}`;
}

/**
 * Check if a keyword has a Wikipedia slug for the given language (or German fallback).
 */
export function hasWikipedia(entry: KeywordEntry): boolean {
  return Object.keys(entry.wikipedia_slugs).length > 0;
}

export function getEcosiaSearchUrl(term: string): string {
  return `https://www.ecosia.org/search?q=${encodeURIComponent(term)}`;
}
