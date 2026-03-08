import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { translateBatch } from '../src/services/translationService';
import type { Question, QuestionStats } from '../src/types';
import { getStatusColor, getStatusIcon } from '../src/utils/difficultyTier';
import { getQuestionImage } from '../src/utils/questionImages';
import TranslatableText from './TranslatableText';
import TranslateIcon from './TranslateIcon';

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
  enableTranslate?: boolean;
  allowChange?: boolean;
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
        style={{ width: '100%' }}
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
  enableTranslate = true,
  allowChange = false,
}: QuestionCardProps) {
  const { t, i18n } = useTranslation();
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState<string[] | null>(null);
  const [translating, setTranslating] = useState(false);

  const targetLanguage = i18n.language;
  const isGerman = targetLanguage === 'de';

  // Reset internal state when the question changes
  useEffect(() => {
    setInternalSelected(null);
    setAnswered(false);
    setShowTranslation(false);
    setTranslations(null);
  }, [question.id]);

  const selectedOption = externalSelectedOption !== undefined ? externalSelectedOption : internalSelected;
  const isAnswered = externalSelectedOption !== undefined ? !!externalSelectedOption : answered;

  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ];

  const handleOptionPress = (optionKey: string) => {
    if (disabled) return;
    if (isAnswered && !allowChange) return;
    setInternalSelected(optionKey);
    setAnswered(true);
    const isCorrect = optionKey === question.correct_option;
    onAnswer(optionKey, isCorrect);
  };

  const handleToggleTranslation = async () => {
    if (isGerman || !enableTranslate) return;

    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translations) {
      setShowTranslation(true);
      return;
    }

    setTranslating(true);
    try {
      const result = await translateBatch(
        [question.question_text, question.option_a, question.option_b, question.option_c, question.option_d],
        targetLanguage
      );
      setTranslations(result.translations);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTranslating(false);
    }
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
            <Text className={`text-lg font-bold ${getStatusColor(questionStats)}`}>
              {getStatusIcon(questionStats)}
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
      <View className="flex-row mb-6">
        <View className="flex-1">
          {showTranslation && translations ? (
            <Text className="text-lg font-medium text-gray-900 leading-7">
              {translations[0]}
            </Text>
          ) : (
            <TranslatableText
              text={question.question_text}
              className="text-lg font-medium text-gray-900 leading-7"
            />
          )}
        </View>
        {enableTranslate && (
          <Pressable
            onPress={handleToggleTranslation}
            className="p-2 ml-1"
            disabled={isGerman || translating}
            accessibilityRole="button"
            accessibilityLabel={showTranslation ? t('translation.show_original') : t('translation.translate_question')}
          >
            {translating ? (
              <Text className={`text-xl ${isGerman ? 'text-gray-300' : 'text-gray-400'}`}>{'\u2026'}</Text>
            ) : (
              <TranslateIcon
                size={22}
                color={isGerman ? '#d1d5db' : showTranslation ? '#6b7281' : '#3ea5e6'}
              />
            )}
          </Pressable>
        )}
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
              disabled={(isAnswered && !allowChange) || disabled}
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
                {showTranslation && translations ? translations[index + 1] : option}
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
