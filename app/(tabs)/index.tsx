import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-primary">Dashboard</Text>
      <Text className="text-base mt-2 text-gray-500">
        Your study progress at a glance
      </Text>
    </View>
  );
}
