import { View, Text } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Einbürgerungstest</Text>
      <Text style={{ fontSize: 16, marginTop: 8, color: '#666' }}>
        Choose your language
      </Text>
    </View>
  );
}
