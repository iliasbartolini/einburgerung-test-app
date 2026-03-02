import { View, Text } from 'react-native';

export default function CatalogScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Question Catalog</Text>
      <Text style={{ fontSize: 16, marginTop: 8, color: '#666' }}>
        Browse all 460 questions
      </Text>
    </View>
  );
}
