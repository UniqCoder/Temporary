import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, useTheme, type Palette } from '../theme';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const box = size === 'sm' ? 28 : 32;
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { width: box, height: box }]}>
        <View style={styles.dot} />
      </View>
      <Text style={styles.text}>Temporary.</Text>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    badge: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2.5,
      borderColor: colors.accentInk,
    },
    text: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  });
}
