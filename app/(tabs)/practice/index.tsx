import { View, Text } from 'react-native';

export default function PracticeModeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Practice</Text>
      <Text style={{ fontSize: 16, marginTop: 8, color: '#666' }}>
        Choose your study mode
      </Text>
    </View>
  );
}
