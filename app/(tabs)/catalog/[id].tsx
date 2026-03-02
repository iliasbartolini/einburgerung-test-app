import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Question #{id}</Text>
    </View>
  );
}
