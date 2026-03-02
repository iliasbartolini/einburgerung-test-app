import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../../src/stores/useAppStore';
import {
  getQuestionsByBundesland,
  getIncorrectQuestions,
} from '../../../src/db/repositories/questionsRepository';
import {
  recordAttempt,
} from '../../../src/db/repositories/attemptsRepository';
import {
  createExamSession,
  completeExamSession,
  generateExamQuestions,
} from '../../../src/db/repositories/examRepository';
import {
  isBookmarked as checkBookmarked,
  toggleBookmark,
} from '../../../src/db/repositories/bookmarksRepository';
import QuestionCard from '../../../components/QuestionCard';
import type { Question } from '../../../src/types';

export default function QuestionScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { bundeslandId } = useAppStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Exam-specific state
  const examSessionRef = useRef<number | null>(null);
  const examStartRef = useRef<number>(0);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes in seconds

  const isExam = mode === 'exam';
  const currentQuestion = questions[currentIndex];

  const loadQuestions = useCallback(async () => {
    if (!bundeslandId) return;
    setLoading(true);
    try {
      let loaded: Question[];
      if (mode === 'exam') {
        loaded = await generateExamQuestions(bundeslandId);
        const sessionId = await createExamSession(bundeslandId);
        examSessionRef.current = sessionId;
        examStartRef.current = Date.now();
      } else if (mode === 'review') {
        loaded = await getIncorrectQuestions(bundeslandId);
      } else {
        loaded = await getQuestionsByBundesland(bundeslandId);
      }
      setQuestions(loaded);
    } catch (e) {
      console.error('Failed to load questions:', e);
    }
    setLoading(false);
  }, [bundeslandId, mode]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Check bookmark status when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    checkBookmarked(currentQuestion.id).then(setBookmarked);
  }, [currentQuestion]);

  const handleAnswer = async (selectedOption: string, isCorrect: boolean) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOption }));
    await recordAttempt(
      currentQuestion.id,
      selectedOption,
      isCorrect,
      mode || 'practice',
      isExam ? examSessionRef.current ?? undefined : undefined
    );
  };

  const handleToggleBookmark = async () => {
    if (!currentQuestion) return;
    const result = await toggleBookmark(currentQuestion.id);
    setBookmarked(result);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (!isExam) {
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleExamSubmit = useCallback(async () => {
    if (!examSessionRef.current) return;
    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correct_option
    ).length;
    const timeTaken = Math.floor((Date.now() - examStartRef.current) / 1000);
    await completeExamSession(examSessionRef.current, correctCount, timeTaken);
    router.replace({
      pathname: '/practice/results',
      params: {
        sessionId: String(examSessionRef.current),
        score: String(correctCount),
        total: String(questions.length),
        timeTaken: String(timeTaken),
      },
    } as any);
  }, [questions, answers, router]);

  // Exam timer
  useEffect(() => {
    if (!isExam || loading) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExamSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExam, loading, handleExamSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-lg text-gray-500 text-center">
          {mode === 'review'
            ? t('practice.no_mistakes')
            : t('common.error')}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">{t('common.ok')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Exam timer */}
      {isExam && (
        <View className="px-4 py-2 bg-primary/5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">
              {t('exam.time_remaining')}
            </Text>
            <Text
              className={`text-lg font-bold ${
                timeRemaining < 300 ? 'text-accent' : 'text-primary'
              }`}
            >
              {formatTime(timeRemaining)}
            </Text>
          </View>
          {/* Exam question navigator */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <View className="flex-row gap-1">
              {questions.map((q, i) => (
                <Pressable
                  key={q.id}
                  onPress={() => setCurrentIndex(i)}
                  className={`w-8 h-8 rounded items-center justify-center ${
                    i === currentIndex
                      ? 'bg-primary'
                      : answers[q.id]
                        ? 'bg-secondary/30'
                        : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      i === currentIndex ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 16 }}>
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            showFeedback={!isExam}
            isBookmarked={bookmarked}
            onToggleBookmark={!isExam ? handleToggleBookmark : undefined}
            selectedOption={answers[currentQuestion.id] ?? null}
          />
        )}
      </ScrollView>

      {/* Navigation */}
      <View className="px-4 py-3 border-t border-gray-100">
        <View className="flex-row gap-3">
          {!isExam && (
            <Pressable
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              className={`flex-1 py-3 rounded-xl items-center border ${
                currentIndex === 0
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-300 bg-white active:bg-gray-50'
              }`}
            >
              <Text
                className={`font-semibold ${
                  currentIndex === 0 ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('practice.previous')}
              </Text>
            </Pressable>
          )}

          {isExam ? (
            <Pressable
              onPress={handleExamSubmit}
              className="flex-1 py-3 rounded-xl items-center bg-accent active:bg-accent/80"
            >
              <Text className="text-white font-semibold">
                {t('exam.submit')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleNext}
              className={`flex-1 py-3 rounded-xl items-center ${
                currentIndex === questions.length - 1
                  ? 'bg-secondary active:bg-secondary/80'
                  : 'bg-primary active:bg-primary/80'
              }`}
            >
              <Text className="text-white font-semibold">
                {currentIndex === questions.length - 1
                  ? t('common.ok')
                  : t('practice.next')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
