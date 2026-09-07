import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { useResponsive } from '../hooks/useResponsive';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  onDone: (dest: 'signup' | 'login') => void;
}

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'purpose',
    eyebrow: 'Temporary.',
    title: "Remember things you don't want to remember forever.",
    body: 'A parking spot. A Wi-Fi password. A promise from a friend. Things that matter right now, and nowhere else.',
  },
  {
    key: 'capture',
    eyebrow: 'Capture',
    title: 'Write it down. That’s the whole app.',
    body: 'No folders, no tags, no organizing. Just say what you need to remember — it becomes a card, instantly.',
  },
  {
    key: 'forget',
    eyebrow: 'Forget',
    title: 'Set when it disappears. Then stop thinking about it.',
    body: 'Every memory has an expiry. When it passes, the memory quietly forgets itself — no cleanup, no clutter.',
  },
];

/** First-run pitch, shown only while logged out. Swipe or tap Next through 3 slides, then choose. */
export function OnboardingScreen({ onDone }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { isTablet } = useResponsive();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const totalPages = SLIDES.length + 1;

  const goTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Logo size="sm" />
        {index < SLIDES.length && (
          <TouchableOpacity onPress={() => goTo(SLIDES.length)} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={[...SLIDES, { key: 'cta' } as Slide]}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item, index: i }: ListRenderItemInfo<Slide>) =>
          i < SLIDES.length ? (
            <View style={[styles.slide, { width }]}>
              <View style={isTablet && styles.slideContentTablet}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.slide, { width }]}>
              <View style={isTablet && styles.slideContentTablet}>
              <Text style={styles.finalTitle}>Your brain has better things to remember.</Text>
              <View style={styles.ctaGroup}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => onDone('signup')}>
                  <Text style={styles.primaryBtnText}>Start remembering</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => onDone('login')}>
                  <Text style={styles.secondaryBtnText}>Log in</Text>
                </TouchableOpacity>
              </View>
              </View>
            </View>
          )
        }
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        {index < SLIDES.length && (
          <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(index + 1)}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    skip: { color: colors.inkDim, fontSize: 14 },
    slide: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
    slideContentTablet: { maxWidth: 480, alignSelf: 'center' },
    eyebrow: { color: colors.accent, fontSize: 13, fontWeight: '600', letterSpacing: 1.5, marginBottom: spacing.md },
    title: { color: colors.ink, fontSize: 30, fontWeight: '500', lineHeight: 38, letterSpacing: -0.5 },
    body: { color: colors.inkDim, fontSize: 16, lineHeight: 24, marginTop: spacing.lg, maxWidth: 340 },
    finalTitle: { color: colors.ink, fontSize: 32, fontWeight: '500', lineHeight: 40, letterSpacing: -0.5, textAlign: 'center' },
    ctaGroup: { marginTop: spacing.xxl, gap: spacing.md, alignItems: 'stretch' },
    primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
    primaryBtnText: { color: colors.accentInk, fontWeight: '600', fontSize: 15 },
    secondaryBtn: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
    secondaryBtnText: { color: colors.ink, fontWeight: '500', fontSize: 15 },
    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, alignItems: 'center' },
    dots: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.accent, width: 18 },
    nextBtn: { alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
    nextBtnText: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  });
}
