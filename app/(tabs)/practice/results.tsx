import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ResultsScreen() {
  const { score, total, timeTaken } = useLocalSearchParams<{
    sessionId: string;
    score: string;
    total: string;
    timeTaken: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const scoreNum = parseInt(score || '0', 10);
  const totalNum = parseInt(total || '33', 10);
  const timeTakenNum = parseInt(timeTaken || '0', 10);
  const passed = scoreNum >= 17;
  const percentage = Math.round((scoreNum / totalNum) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* Result badge */}
        <View
          className={`w-40 h-40 rounded-full items-center justify-center mb-8 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <Text className="text-5xl font-bold text-primary">{scoreNum}</Text>
          <Text className="text-sm text-gray-500">
            / {totalNum} ({percentage}%)
          </Text>
        </View>

        <Text
          className={`text-3xl font-bold mb-2 ${
            passed ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {passed ? t('exam.passed') : t('exam.failed')}
        </Text>

        <Text className="text-base text-gray-500 text-center mb-4">
          {t('exam.pass_threshold')}
        </Text>

        <Text className="text-sm text-gray-400">
          {t('exam.time_remaining')}: {formatTime(timeTakenNum)}
        </Text>

        <View className="w-full gap-3 mt-12">
          <Pressable
            onPress={() => router.replace({ pathname: '/practice/question', params: { mode: 'exam' } } as any)}
            className="py-4 rounded-xl items-center bg-primary active:bg-primary/80"
          >
            <Text className="text-white font-semibold text-lg">
              {t('exam.try_again')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.navigate('/' as any)}
            className="py-4 rounded-xl items-center border border-gray-300 active:bg-gray-50"
          >
            <Text className="text-gray-700 font-semibold text-lg">
              {t('tabs.home')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
