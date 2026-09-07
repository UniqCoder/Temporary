import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EXPIRY_CHOICES } from '@tm/shared';
import { radius, useTheme, type Palette } from '../theme';

interface Props {
  selectedKey: string;
  disabled?: boolean;
  onSelect: (key: string) => void;
}

/** Horizontal row of quick expiry choices (30 min, 2 hours, Tonight, ... Custom). */
export function ExpiryChips({ selectedKey, disabled, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {EXPIRY_CHOICES.map((choice) => {
        const active = !disabled && choice.key === selectedKey;
        return (
          <TouchableOpacity
            key={choice.key}
            onPress={() => onSelect(choice.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{choice.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: { gap: 6, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: radius.sm,
    },
    chipActive: { backgroundColor: colors.accent },
    chipText: { color: colors.inkDim, fontSize: 12, fontWeight: '500' },
    chipTextActive: { color: colors.accentInk },
  });
}
