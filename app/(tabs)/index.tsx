import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../../src/stores/useAppStore';
import {
  getTotalAttempts,
  getCorrectAttempts,
  getAttemptedQuestionCount,
} from '../../src/db/repositories/attemptsRepository';
import { getQuestionsByBundesland } from '../../src/db/repositories/questionsRepository';
import { getExamHistory } from '../../src/db/repositories/examRepository';
import type { ExamSession } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bundeslandId } = useAppStore();

  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(310);
  const [recentExams, setRecentExams] = useState<ExamSession[]>([]);

  const loadStats = useCallback(async () => {
    if (!bundeslandId) return;
    const [total, correct, attempted, questions, exams] = await Promise.all([
      getTotalAttempts(),
      getCorrectAttempts(),
      getAttemptedQuestionCount(),
      getQuestionsByBundesland(bundeslandId),
      getExamHistory(),
    ]);
    setTotalAttempts(total);
    setCorrectAttempts(correct);
    setAttemptedCount(attempted);
    setTotalQuestions(questions.length);
    setRecentExams(exams.slice(0, 3));
  }, [bundeslandId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const coverage = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
  const readiness = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * (attemptedCount / totalQuestions) * 100)
    : 0;

  const readinessColor = readiness >= 67 ? '#22C55E' : readiness >= 34 ? '#EAB308' : '#EF4444';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Readiness Score */}
        <View className="items-center mb-8 mt-4">
          <View
            className="w-36 h-36 rounded-full items-center justify-center mb-3"
            style={{ borderWidth: 8, borderColor: readinessColor }}
          >
            <Text className="text-4xl font-bold" style={{ color: readinessColor }}>{readiness}%</Text>
            <Text className="text-xs text-gray-500">{t('home.readiness')}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-light rounded-xl p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{accuracy}%</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              {t('home.accuracy')}
            </Text>
          </View>
          <View className="flex-1 bg-light rounded-xl p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{attemptedCount}</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              {t('home.questions_practiced')}
            </Text>
          </View>
          <View className="flex-1 bg-light rounded-xl p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{coverage}%</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">Coverage</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          {t('home.quick_actions')}
        </Text>
        <View className="gap-3 mb-6">
          <Pressable
            onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'practice' } } as any)}
            className="flex-row items-center p-4 rounded-xl bg-primary active:bg-primary/80"
            accessibilityRole="button"
          >
            <Text className="text-2xl mr-3">{'\u270F\uFE0F'}</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">
                {t('home.start_practice')}
              </Text>
            </View>
          </Pressable>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'exam' } } as any)}
              className="flex-1 p-4 rounded-xl bg-secondary active:bg-secondary/80"
              accessibilityRole="button"
            >
              <Text className="text-2xl mb-1">{'\u23F1\uFE0F'}</Text>
              <Text className="text-white font-semibold text-sm">
                {t('home.take_exam')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'review' } } as any)}
              className="flex-1 p-4 rounded-xl bg-accent active:bg-accent/80"
              accessibilityRole="button"
            >
              <Text className="text-2xl mb-1">{'\uD83D\uDD04'}</Text>
              <Text className="text-white font-semibold text-sm">
                {t('home.review_mistakes')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Exams */}
        {recentExams.length > 0 && (
          <View>
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Recent Exams
            </Text>
            <View className="gap-2">
              {recentExams.map((exam) => (
                <View
                  key={exam.id}
                  className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <View>
                    <Text className="text-sm text-gray-500">
                      {new Date(exam.completed_at!).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-primary">
                      {exam.score}/{exam.total}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded ${
                        exam.passed ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          exam.passed ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {exam.passed ? t('exam.passed') : t('exam.failed')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
