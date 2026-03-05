import { View, Text, Pressable, SafeAreaView, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../../src/stores/useAppStore';
import {
  getQuestionsByBundesland,
  getIncorrectQuestions,
  getSmartStartQuestionId,
  getAllQuestionStats,
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
import type { Question, QuestionStats } from '../../../src/types';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
  const [statsMap, setStatsMap] = useState<Record<number, QuestionStats>>({});
  const navigatorRef = useRef<ScrollView>(null);

  // Exam-specific state
  const examSessionRef = useRef<number | null>(null);
  const examStartRef = useRef<number>(0);
  const handleExamSubmitRef = useRef<() => void>(() => {});
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes in seconds
  const [showConfirm, setShowConfirm] = useState(false);

  const isExam = mode === 'exam';
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

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

        // Load stats for navigator colors and find smart start position
        const [allStats, smartStartId] = await Promise.all([
          getAllQuestionStats(),
          getSmartStartQuestionId(bundeslandId),
        ]);
        const map: Record<number, QuestionStats> = {};
        for (const s of allStats) {
          map[s.question_id] = s;
        }
        setStatsMap(map);

        if (smartStartId != null) {
          const idx = loaded.findIndex((q) => q.id === smartStartId);
          if (idx > 0) setCurrentIndex(idx);
        }
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
    // Update statsMap immediately so navigator pill colors refresh
    if (isPractice) {
      setStatsMap((prev) => {
        const old = prev[currentQuestion.id];
        const totalAttempts = (old?.total_attempts ?? 0) + 1;
        const correctCount = (old?.correct_count ?? 0) + (isCorrect ? 1 : 0);
        const accuracy = correctCount / totalAttempts;
        const difficulty_tier: QuestionStats['difficulty_tier'] =
          accuracy >= 0.9 ? 'mastered' :
          accuracy >= 0.7 ? 'comfortable' :
          'struggling';
        return {
          ...prev,
          [currentQuestion.id]: {
            question_id: currentQuestion.id,
            total_attempts: totalAttempts,
            correct_count: correctCount,
            accuracy,
            difficulty_tier,
            last_attempted_at: new Date().toISOString(),
          },
        };
      });
    }
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

  handleExamSubmitRef.current = handleExamSubmit;

  const confirmExamSubmit = useCallback(() => {
    setShowConfirm(true);
  }, []);

  // Exam timer
  useEffect(() => {
    if (!isExam || loading) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExamSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExam, loading]);

  // Auto-scroll navigator to current question
  const isPractice = mode === 'practice';
  useEffect(() => {
    if (!isPractice || !navigatorRef.current) return;
    // Each button is 32px wide + 4px gap
    const scrollX = Math.max(0, currentIndex * 36 - 120);
    navigatorRef.current.scrollTo({ x: scrollX, animated: true });
  }, [currentIndex, isPractice]);

  const getNavigatorColor = (questionId: number, index: number) => {
    if (index === currentIndex) return 'bg-primary';
    const stats = statsMap[questionId];
    if (!stats || stats.difficulty_tier === 'unseen') return 'bg-gray-100';
    switch (stats.difficulty_tier) {
      case 'mastered': return 'bg-green-200';
      case 'comfortable': return 'bg-amber-200';
      case 'struggling': return 'bg-red-200';
      default: return 'bg-gray-100';
    }
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

      {/* Practice question navigator */}
      {isPractice && (
        <View className="px-4 py-2 bg-primary/5">
          <ScrollView
            ref={navigatorRef}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View className="flex-row gap-1">
              {questions.map((q, i) => (
                <Pressable
                  key={q.id}
                  onPress={() => setCurrentIndex(i)}
                  className={`w-8 h-8 rounded items-center justify-center ${getNavigatorColor(q.id, i)}`}
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

          <Pressable
            onPress={handleNext}
            disabled={isExam && isLastQuestion}
            className={`flex-1 py-3 rounded-xl items-center ${
              isExam
                ? isLastQuestion ? 'bg-primary/40' : 'bg-primary active:bg-primary/80'
                : isLastQuestion ? 'bg-secondary active:bg-secondary/80' : 'bg-primary active:bg-primary/80'
            }`}
          >
            <Text className="text-white font-semibold">
              {!isExam && isLastQuestion ? t('common.ok') : t('practice.next')}
            </Text>
          </Pressable>
        </View>

        {isExam && (
          <Pressable
            onPress={confirmExamSubmit}
            className="mt-3 py-3 rounded-xl items-center bg-accent active:bg-accent/80"
          >
            <Text className="text-white font-semibold">
              {t('exam.submit')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Submit confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/30"
          onPress={() => setShowConfirm(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-5 mx-8 w-72 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-primary mb-1">
              {t('exam.submit_confirm_title')}
            </Text>
            <Text className="text-base text-gray-700 mb-4">
              {t('exam.submit_confirm')}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-100 items-center"
              >
                <Text className="text-gray-600 font-medium">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowConfirm(false);
                  handleExamSubmit();
                }}
                className="flex-1 py-2 rounded-lg bg-accent items-center"
              >
                <Text className="text-white font-medium">{t('exam.submit')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
