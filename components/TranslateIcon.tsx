import { View, Text } from 'react-native';

interface TranslateIconProps {
  size?: number;
  color?: string;
}

export default function TranslateIcon({ size = 20, color = '#6b7280' }: TranslateIconProps) {
  const largeFont = size * 0.8;
  const smallFont = size * 0.55;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Text
        style={{
          fontSize: largeFont,
          fontWeight: '700',
          color,
          position: 'absolute',
          top: -size * 0.05,
          left: 0,
          lineHeight: largeFont * 1.1,
        }}
      >
        A
      </Text>
      <Text
        style={{
          fontSize: smallFont,
          fontWeight: '700',
          color,
          position: 'absolute',
          bottom: -size * 0.05,
          right: 0,
          lineHeight: smallFont * 1.1,
        }}
      >
        文
      </Text>
    </View>
  );
}
