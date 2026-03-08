import { View, ScrollView, Pressable, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useState, useRef, ReactNode, forwardRef, useImperativeHandle } from 'react';

interface ScrollableQuestionNavigatorProps {
  children: ReactNode;
}

const ScrollableQuestionNavigator = forwardRef<ScrollView, ScrollableQuestionNavigatorProps>(
  ({ children }, forwardedRef) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [scrollViewWidth, setScrollViewWidth] = useState(0);
    const scrollPositionRef = useRef(0);

    // Expose the ScrollView ref to parent
    useImperativeHandle(forwardedRef, () => scrollViewRef.current as ScrollView);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollX = contentOffset.x;
      const maxScroll = contentSize.width - layoutMeasurement.width;

      scrollPositionRef.current = scrollX;
      setCanScrollLeft(scrollX > 5);
      setCanScrollRight(scrollX < maxScroll - 5);
    };

    const handleLayout = (event: any) => {
      setScrollViewWidth(event.nativeEvent.layout.width);
    };

    const handleContentSizeChange = (width: number) => {
      // Initial check if content is scrollable
      setCanScrollRight(width > scrollViewWidth);
    };

    const scrollLeft = () => {
      const newX = Math.max(0, scrollPositionRef.current - 200);
      scrollViewRef.current?.scrollTo({ x: newX, animated: true });
    };

    const scrollRight = () => {
      const newX = scrollPositionRef.current + 200;
      scrollViewRef.current?.scrollTo({ x: newX, animated: true });
    };

    return (
      <View className="flex-row items-center">
        {/* Left arrow */}
        {canScrollLeft && (
          <Pressable
            onPress={scrollLeft}
            className="absolute left-0 z-10 bg-white/90 rounded-full p-1 shadow-sm"
            style={{ elevation: 2 }}
          >
            <SymbolView
              name={{
                ios: 'chevron.left.circle.fill',
                android: 'chevron_left',
                web: 'chevron_left'
              }}
              tintColor="#1D3557"
              size={20}
            />
          </Pressable>
        )}

        {/* ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: canScrollLeft || canScrollRight ? 28 : 0
          }}
        >
          {children}
        </ScrollView>

        {/* Right arrow */}
        {canScrollRight && (
          <Pressable
            onPress={scrollRight}
            className="absolute right-0 z-10 bg-white/90 rounded-full p-1 shadow-sm"
            style={{ elevation: 2 }}
          >
            <SymbolView
              name={{
                ios: 'chevron.right.circle.fill',
                android: 'chevron_right',
                web: 'chevron_right'
              }}
              tintColor="#1D3557"
              size={20}
            />
          </Pressable>
        )}
      </View>
    );
  }
);

ScrollableQuestionNavigator.displayName = 'ScrollableQuestionNavigator';

export default ScrollableQuestionNavigator;
