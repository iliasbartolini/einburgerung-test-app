import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import QuestionCard from '../QuestionCard';
import type { Question } from '../../src/types';

// Mock TranslatableText as a simple Text passthrough
jest.mock('../TranslatableText', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  const MockTranslatableText = ({ text }: { text: string }) => <Text>{text}</Text>;
  MockTranslatableText.displayName = 'TranslatableText';
  return MockTranslatableText;
});

const mockQuestion: Question = {
  id: 42,
  question_text: 'Was ist die Hauptstadt von Deutschland?',
  option_a: 'Berlin',
  option_b: 'München',
  option_c: 'Hamburg',
  option_d: 'Köln',
  correct_option: 'a',
  topic: 'politik',
  bundesland_id: null,
  has_image: 0,
  image_asset_path: null,
};

describe('QuestionCard', () => {
  const defaultProps = {
    question: mockQuestion,
    questionNumber: 5,
    totalQuestions: 33,
    onAnswer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders question text and all 4 options', () => {
    render(<QuestionCard {...defaultProps} />);

    expect(
      screen.getByText('Was ist die Hauptstadt von Deutschland?')
    ).toBeTruthy();
    expect(screen.getByText('Berlin')).toBeTruthy();
    expect(screen.getByText('München')).toBeTruthy();
    expect(screen.getByText('Hamburg')).toBeTruthy();
    expect(screen.getByText('Köln')).toBeTruthy();
  });

  it('renders question number', () => {
    render(<QuestionCard {...defaultProps} />);
    expect(screen.getByText('5 / 33')).toBeTruthy();
  });

  it('calls onAnswer with correct args when tapping correct option', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard {...defaultProps} onAnswer={onAnswer} />);

    fireEvent.press(screen.getByLabelText('Option A: Berlin'));

    expect(onAnswer).toHaveBeenCalledWith('a', true);
  });

  it('calls onAnswer with correct args when tapping wrong option', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard {...defaultProps} onAnswer={onAnswer} />);

    fireEvent.press(screen.getByLabelText('Option C: Hamburg'));

    expect(onAnswer).toHaveBeenCalledWith('c', false);
  });

  it('does not fire onAnswer again after already answered', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard {...defaultProps} onAnswer={onAnswer} />);

    fireEvent.press(screen.getByLabelText('Option A: Berlin'));
    fireEvent.press(screen.getByLabelText('Option B: München'));

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('shows correct feedback after answering correctly', () => {
    render(<QuestionCard {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Option A: Berlin'));

    expect(screen.getByText(/Correct/)).toBeTruthy();
  });

  it('shows incorrect feedback after answering wrong', () => {
    render(<QuestionCard {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Option C: Hamburg'));

    expect(screen.getByText(/Incorrect/)).toBeTruthy();
  });

  it('calls onToggleBookmark when bookmark button is pressed', () => {
    const onToggleBookmark = jest.fn();
    render(
      <QuestionCard {...defaultProps} onToggleBookmark={onToggleBookmark} />
    );

    fireEvent.press(screen.getByLabelText('Add bookmark'));

    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
  });

  it('shows filled star when bookmarked', () => {
    render(
      <QuestionCard
        {...defaultProps}
        isBookmarked={true}
        onToggleBookmark={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Remove bookmark')).toBeTruthy();
  });
});
