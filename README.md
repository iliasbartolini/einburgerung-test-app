# Einbürgerungstest

A free, open-source mobile app to help immigrants prepare for Germany's citizenship test (Einbürgerungstest). Built with React Native and Expo, it works offline-first and supports 6 UI languages.

## Features

- All 460 official BAMF test questions (300 general + 160 state-specific)
- 6 UI languages: English, German, Turkish, Arabic, Russian, French
- Word-level interactive translation for German question text
- Practice mode with instant feedback
- Timed exam simulation (33 questions, 60 minutes, pass at 17/33)
- Question catalog with search and filtering
- Bookmarks for focused review
- Bundesland-specific question sets
- RTL support (Arabic)
- Offline-first — no internet required after install

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
git clone https://github.com/iliasbartolini/einburgerung-test-app.git
cd einburgerung-test-app
npm install
```

### Running

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

### Questions Data Pipeline

```bash
npx tsx scripts/transform-questions.ts   # Transform source questions → app format
```

## Tech Stack

- **Framework**: React Native + Expo SDK 55
- **Routing**: Expo Router (file-based)
- **Database**: expo-sqlite (offline-first, WAL mode)
- **Styling**: NativeWind v4 (Tailwind CSS)
- **State**: Zustand (transient UI) + SQLite (persistent data)
- **i18n**: react-i18next
- **Lists**: @shopify/flash-list

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
