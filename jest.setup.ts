// Extended matchers from @testing-library/react-native (built-in since v12.4)
import '@testing-library/react-native/build/matchers/extend-expect';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock flash cards repository
jest.mock('./src/db/repositories/flashCardsRepository', () => ({
  isFlashCardSaved: jest.fn().mockResolvedValue(false),
  saveFlashCard: jest.fn().mockResolvedValue(undefined),
  removeFlashCard: jest.fn().mockResolvedValue(undefined),
  getFlashCardByWord: jest.fn().mockResolvedValue(null),
  getFlashCardsForReview: jest.fn().mockResolvedValue([]),
  recordFlashCardReview: jest.fn().mockResolvedValue(undefined),
  getFlashCardCount: jest.fn().mockResolvedValue(0),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));
