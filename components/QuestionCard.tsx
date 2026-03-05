import { View, Text, Pressable, Image } from 'react-native';
import { useState, useEffect } from 'react';
import type { Question, QuestionStats } from '../src/types';
import TranslatableText from './TranslatableText';
import { getQuestionImage } from '../src/utils/questionImages';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedOption: string, isCorrect: boolean) => void;
  showFeedback?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  disabled?: boolean;
  selectedOption?: string | null;
  questionStats?: QuestionStats | null;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;

function QuestionImage({ questionId }: { questionId: number }) {
  const source = getQuestionImage(questionId)!;
  const [aspectRatio, setAspectRatio] = useState(532 / 378);

  return (
    <View className="mb-6">
      <Image
        source={source}
        style={{ width: '100%', aspectRatio }}
        resizeMode="contain"
        onLoad={(e) => {
          const src = e.nativeEvent.source ?? e.nativeEvent;
          const { width, height } = src;
          if (width && height) setAspectRatio(width / height);
        }}
        accessibilityLabel={`Image for question ${questionId}`}
      />
    </View>
  );
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback = true,
  isBookmarked = false,
  onToggleBookmark,
  disabled = false,
  selectedOption: externalSelectedOption,
  questionStats,
}: QuestionCardProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Reset internal state when the question changes
  useEffect(() => {
    setInternalSelected(null);
    setAnswered(false);
  }, [question.id]);

  const selectedOption = externalSelectedOption !== undefined ? externalSelectedOption : internalSelected;
  const isAnswered = externalSelectedOption !== undefined ? !!externalSelectedOption : answered;

  const getStatusIcon = () => {
    if (!questionStats || questionStats.total_attempts === 0) return '\u2014'; // —
    if (questionStats.difficulty_tier === 'mastered') return '\u2713';
    if (questionStats.difficulty_tier === 'struggling') return '\u2717';
    return '\u23FA'; // middle dot
  };

  const getStatusColor = () => {
    if (!questionStats || questionStats.total_attempts === 0) return 'text-gray-300';
    if (questionStats.difficulty_tier === 'mastered') return 'text-green-500';
    if (questionStats.difficulty_tier === 'struggling') return 'text-red-500';
    return 'text-yellow-500';
  };

  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ];

  const handleOptionPress = (optionKey: string) => {
    if (isAnswered || disabled) return;
    setInternalSelected(optionKey);
    setAnswered(true);
    const isCorrect = optionKey === question.correct_option;
    onAnswer(optionKey, isCorrect);
  };

  const getOptionStyle = (optionKey: string) => {
    if (!isAnswered || !showFeedback) {
      if (selectedOption === optionKey) {
        return 'border-secondary bg-secondary/10';
      }
      return 'border-gray-200 bg-white';
    }

    if (optionKey === question.correct_option) {
      return 'border-green-500 bg-green-50';
    }
    if (selectedOption === optionKey && optionKey !== question.correct_option) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 bg-white opacity-50';
  };

  const getOptionTextColor = (optionKey: string) => {
    if (!isAnswered || !showFeedback) {
      if (selectedOption === optionKey) return 'text-primary font-semibold';
      return 'text-gray-800';
    }

    if (optionKey === question.correct_option) return 'text-green-700 font-semibold';
    if (selectedOption === optionKey) return 'text-red-700 font-semibold';
    return 'text-gray-400';
  };

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm text-gray-500">
          {questionNumber} / {totalQuestions}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="bg-secondary/20 px-3 py-1 rounded-full">
            <Text className="text-xs text-secondary font-medium capitalize">
              {question.topic}
            </Text>
          </View>
          {questionStats && (
            <Text className={`text-lg font-bold ${getStatusColor()}`}>
              {getStatusIcon()}
            </Text>
          )}
          {onToggleBookmark && (
            <Pressable
              onPress={onToggleBookmark}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Text className="text-xl">{isBookmarked ? '\u2605' : '\u2606'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Question Text */}
      <View className="mb-6">
        <TranslatableText
          text={question.question_text}
          className="text-lg font-medium text-gray-900 leading-7"
        />
      </View>

      {/* Question Image */}
      {question.has_image === 1 && getQuestionImage(question.id) && (
        <QuestionImage questionId={question.id} />
      )}

      {/* Options */}
      <View className="gap-3">
        {options.map((option, index) => {
          const optionKey = OPTION_KEYS[index];
          return (
            <Pressable
              key={optionKey}
              onPress={() => handleOptionPress(optionKey)}
              disabled={isAnswered || disabled}
              className={`flex-row items-center px-4 py-4 rounded-xl border-2 ${getOptionStyle(optionKey)}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedOption === optionKey }}
              accessibilityLabel={`Option ${OPTION_LABELS[index]}: ${option}`}
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                  selectedOption === optionKey ? 'bg-secondary' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    selectedOption === optionKey ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {OPTION_LABELS[index]}
                </Text>
              </View>
              <Text className={`flex-1 text-base ${getOptionTextColor(optionKey)}`}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback */}
      {isAnswered && showFeedback && (
        <View
          className={`mt-4 p-3 rounded-lg ${
            selectedOption === question.correct_option
              ? 'bg-green-50'
              : 'bg-red-50'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              selectedOption === question.correct_option
                ? 'text-green-700'
                : 'text-red-700'
            }`}
          >
            {selectedOption === question.correct_option
              ? '\u2713 Correct!'
              : '\u2717 Incorrect'}
          </Text>
        </View>
      )}
    </View>
  );
}
