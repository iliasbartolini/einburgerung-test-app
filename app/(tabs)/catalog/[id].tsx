import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { getQuestionById, getQuestionStats } from '../../../src/db/repositories/questionsRepository';
import { isBookmarked as checkBookmarked, toggleBookmark } from '../../../src/db/repositories/bookmarksRepository';
import { recordAttempt } from '../../../src/db/repositories/attemptsRepository';
import QuestionCard from '../../../components/QuestionCard';
import type { Question, QuestionStats } from '../../../src/types';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const qId = parseInt(id, 10);
    getQuestionById(qId).then(setQuestion);
    getQuestionStats(qId).then(setStats);
    checkBookmarked(qId).then(setBookmarked);
  }, [id]);

  const handleAnswer = async (selectedOption: string, isCorrect: boolean) => {
    if (!question) return;
    await recordAttempt(question.id, selectedOption, isCorrect, 'practice');
    const updated = await getQuestionStats(question.id);
    setStats(updated);
  };

  const handleToggleBookmark = async () => {
    if (!question) return;
    const result = await toggleBookmark(question.id);
    setBookmarked(result);
  };

  if (!question) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 16 }}>
        <QuestionCard
          question={question}
          questionNumber={question.id}
          totalQuestions={460}
          onAnswer={handleAnswer}
          showFeedback
          isBookmarked={bookmarked}
          onToggleBookmark={handleToggleBookmark}
        />

        {/* Stats */}
        {stats && stats.total_attempts > 0 && (
          <View className="mx-4 mt-6 p-4 bg-gray-50 rounded-xl">
            <Text className="text-sm font-semibold text-gray-600 mb-2">Your Stats</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-gray-400">Attempts</Text>
                <Text className="text-lg font-bold text-primary">{stats.total_attempts}</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400">Accuracy</Text>
                <Text className="text-lg font-bold text-primary">{stats.accuracy}%</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400">Level</Text>
                <Text className="text-lg font-bold text-primary capitalize">{stats.difficulty_tier}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
