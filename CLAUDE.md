# CLAUDE.md

## Project Overview

German citizenship test (Einbürgerungstest) preparation app. React Native + Expo SDK 55, offline-first, 460 bundled questions, 6 UI languages. See `docs/PLAN.md` for the full product spec.

## Commands

```bash
# Development
npm start                              # Start Expo dev server (Metro)
npm run ios                            # Run on iOS simulator
npm run android                        # Run on Android emulator
npm run web                            # Run in browser
npx expo start --clear                 # Start with cleared Metro cache

# Data pipeline
npx tsx scripts/transform-questions.ts # Transform source questions → assets/data/questions.json

# Type checking & linting
npx tsc --noEmit                       # TypeScript check
npm run lint                           # ESLint (eslint-config-expo flat config)
npm run lint -- --fix                  # ESLint with auto-fix
```

## Architecture

### Data Flow
The root layout (`app/_layout.tsx`) orchestrates initialization: DB schema creation → question seeding → loading persisted user settings → onboarding redirect (if needed) → splash screen hide.

### Routing (Expo Router, file-based)
- `app/onboarding/` — Welcome (language picker) → Bundesland selector. Shown once, gated by `isOnboarded` in Zustand store.
- `app/(tabs)/` — Main app: Home (dashboard), Practice (mode selector → question flow → results), Catalog (search/filter → detail), Profile (settings).
- Onboarding redirect logic lives in `app/_layout.tsx` via `useSegments()`.

### State Management
- **Zustand** (`src/stores/useAppStore.ts`): Transient flags only — `isOnboarded`, `uiLanguage`, `bundeslandId`, `isDbReady`.
- **SQLite**: All persistent data — settings, attempts, bookmarks, exam sessions, translation cache.
- **Component state**: UI-only concerns (selected option, timer, scroll position).

### Database Layer
- `src/db/schema.ts` — Table definitions, versioned via `PRAGMA user_version`.
- `src/db/database.ts` — Singleton connection, `initDatabase()`, `seedQuestions()`.
- `src/db/repositories/` — One file per entity. Export plain async functions, not classes. Always use parameterized queries.

### Key Components
- `QuestionCard` — Reusable across practice/exam/review/catalog. Accepts `showFeedback` (false in exam mode), `selectedOption` (for exam navigator), `onToggleBookmark`.
- `TranslatableText` — Wraps German text, splits into tappable words, shows translation popover via modal. Uses `src/services/translationService.ts` (cache-first, then Google API).

### i18n
- react-i18next with 6 locales in `src/i18n/locales/`. Language list and RTL config in `src/i18n/index.ts`.
- Arabic (`ar`) is RTL. All others LTR.
- Translation keys are hierarchical: `onboarding.welcome_title`, `practice.correct`, etc.

## Pre-commit Checklist

Before every commit, run all three checks and fix any issues:
1. `npx tsc --noEmit` — TypeScript must pass with no errors
2. `npm run lint` — ESLint must pass with no errors
3. `npm test` — All tests must pass

## Key Conventions

- **Styling**: NativeWind v4 (Tailwind classes via `className`). Custom palette defined in `tailwind.config.js`: `primary` (#1D3557), `secondary` (#457B9D), `accent` (#E63946), `light` (#F1FAEE).
- **DB access**: Always through repository functions, never import `getDatabase()` directly in components.
- **All UI strings** go through `t()` from `useTranslation()`. No hardcoded user-facing text.
- **Question IDs** are BAMF numbers 1-460. Topics by range: 1-100 politik, 101-200 geschichte, 201-300 gesellschaft, 301-460 bundesland.
- **Bundesland IDs** 1-16 are defined in `src/types/index.ts` (`BUNDESLAENDER` array). Order: Baden-Württemberg=1 through Thüringen=16 (not alphabetical).
- **Exam rules**: 33 questions (30 general + 3 state-specific), 60-min timer, pass threshold 17/33.

## Metro/Build Quirks

- `.wasm` added to `resolver.assetExts` in `metro.config.js` — required for expo-sqlite web support.
- NativeWind wired through both `metro.config.js` (`withNativeWind`) and `babel.config.js` (`jsxImportSource: "nativewind"`).
- `@shopify/flash-list` pinned to 2.0.2 for Expo SDK 55 compatibility. v2 removed `estimatedItemSize` prop.
