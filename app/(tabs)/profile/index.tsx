import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
      <Text style={{ fontSize: 16, marginTop: 8, color: '#666' }}>
        Settings and progress
      </Text>
    </View>
  );
}
