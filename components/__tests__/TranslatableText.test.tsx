import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TranslatableText from '../TranslatableText';

// Mock translateWord
const mockTranslateWord = jest.fn();
jest.mock('../../src/services/translationService', () => ({
  translateWord: (...args: any[]) => mockTranslateWord(...args),
}));

// Override default react-i18next mock per-test via mockLanguage
let mockLanguage = 'en';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { get language() { return mockLanguage; } },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLanguage = 'en';
});

describe('TranslatableText', () => {
  it('renders all words from text', () => {
    render(<TranslatableText text="Hallo Welt" />);

    expect(screen.getByText('Hallo')).toBeTruthy();
    expect(screen.getByText('Welt')).toBeTruthy();
  });

  it('tapping a word shows translation in modal', async () => {
    mockTranslateWord.mockResolvedValue({
      translatedText: 'Hello',
      fromCache: false,
    });

    render(<TranslatableText text="Hallo Welt" />);

    fireEvent.press(screen.getByLabelText('Translate: Hallo'));

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeTruthy();
    });

    expect(mockTranslateWord).toHaveBeenCalledWith('Hallo', 'en');
  });

  it('in German mode, tapping a word does nothing', () => {
    mockLanguage = 'de';

    render(<TranslatableText text="Hallo Welt" />);

    fireEvent.press(screen.getByLabelText('Translate: Hallo'));

    expect(mockTranslateWord).not.toHaveBeenCalled();
  });

  it('shows error message when translation fails', async () => {
    mockTranslateWord.mockRejectedValue(
      new Error('TRANSLATION_UNAVAILABLE')
    );

    render(<TranslatableText text="Hallo Welt" />);

    fireEvent.press(screen.getByLabelText('Translate: Hallo'));

    await waitFor(() => {
      expect(
        screen.getByText('translation.translation_unavailable')
      ).toBeTruthy();
    });
  });
});
