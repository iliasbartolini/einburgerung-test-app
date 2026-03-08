import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import ScrollableQuestionNavigator from '../ScrollableQuestionNavigator';

// Mock expo-symbols
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

describe('ScrollableQuestionNavigator', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ScrollableQuestionNavigator>
        <View>
          <Text>Test Content</Text>
        </View>
      </ScrollableQuestionNavigator>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <ScrollableQuestionNavigator>
        <View>
          <Text>Item 1</Text>
          <Text>Item 2</Text>
          <Text>Item 3</Text>
        </View>
      </ScrollableQuestionNavigator>
    );

    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
    expect(getByText('Item 3')).toBeTruthy();
  });
});
