import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAttemptedQuestionCount,
  getCorrectAttempts,
  getTotalAttempts,
} from '../../src/db/repositories/attemptsRepository';
import { getExamHistory } from '../../src/db/repositories/examRepository';
import { getQuestionsByBundesland } from '../../src/db/repositories/questionsRepository';
import { useAppStore } from '../../src/stores/useAppStore';
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

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
  const coverage = totalQuestions > 0 ? attemptedCount / totalQuestions : 0;
  
  const coverageFactor = (coverage <= 0 ? 0.1 : 
    Math.min(1, Math.max(0.1, 1 + Math.log(coverage+0.2) / 1.8))
  );
  
  const readiness = Math.round(coverageFactor * accuracy * 100);

  const accuracyPercentage = Math.round(accuracy * 100);
  const coveragePercentage = Math.round(coverage * 100);

  const readinessColor = readiness >= 80 ? '#22C55E' : readiness >= 70 ? '#EAB308' : '#EF4444';

  return (
    <View className="flex-1 bg-white">
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
            <Text className="text-2xl font-bold text-primary">{accuracyPercentage}%</Text>
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
            <Text className="text-2xl font-bold text-primary">{coveragePercentage}%</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">Coverage</Text>
          </View>
        </View>

        {/* Practice */}
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          {t('home.quick_actions')}
        </Text>
        <View className="gap-3 mb-6">
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'practice' } } as any)}
              className="flex-1 p-4 rounded-xl bg-primary active:bg-primary/80"
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={28} color="white" style={{ marginBottom: 4 }} />
              <Text className="text-white font-semibold text-sm">
                {t('practice.practice_mode')}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                {t('practice.practice_desc')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'exam' } } as any)}
              className="flex-1 p-4 rounded-xl bg-secondary active:bg-secondary/80"
              accessibilityRole="button"
            >
              <Ionicons name="timer-outline" size={28} color="white" style={{ marginBottom: 4 }} />
              <Text className="text-white font-semibold text-sm">
                {t('practice.exam_mode')}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                {t('practice.exam_desc')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push({ pathname: '/practice/question', params: { mode: 'review' } } as any)}
              className="flex-1 p-4 rounded-xl bg-accent active:bg-accent/80"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={28} color="white" style={{ marginBottom: 4 }} />
              <Text className="text-white font-semibold text-sm">
                {t('practice.review_mode')}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                {t('practice.review_desc')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/practice/flashcards' as any)}
              className="flex-1 p-4 rounded-xl bg-amber-600 active:bg-amber-600/80"
              accessibilityRole="button"
            >
              <Ionicons name="card-outline" size={28} color="white" style={{ marginBottom: 4 }} />
              <Text className="text-white font-semibold text-sm">
                {t('practice.flashcards_mode')}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                {t('practice.flashcards_desc')}
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
    </View>
  );
}
