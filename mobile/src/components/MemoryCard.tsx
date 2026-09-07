import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import type { MemoryDTO } from '@tm/shared';
import { formatRemaining, formatCreated } from '@tm/shared';
import { useNow } from '../hooks/useNow';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  memory: MemoryDTO;
  onOpen: (memory: MemoryDTO) => void;
  onExtend: (memory: MemoryDTO, durationMs: number) => void;
  onDelete: (memory: MemoryDTO) => void;
}

/** The written memory itself is the headline — there's no separate title. */
export function MemoryCard({ memory, onOpen, onExtend, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const now = useNow(1000);
  const remaining = formatRemaining(memory.expiresAt, now);
  const ms = new Date(memory.expiresAt).getTime() - now;
  const urgent = ms < 5 * 60_000;
  const soon = ms < 30 * 60_000 && !urgent;
  const primaryText = memory.content || memory.title;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onOpen(memory)} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.primary} numberOfLines={4}>
          {primaryText}
        </Text>
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.menuBtn}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.created}>{formatCreated(memory.createdAt)}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>FORGETS IN</Text>
        <Text
          style={[
            styles.footerValue,
            urgent && styles.danger,
            soon && styles.accent,
            remaining === 'Forgotten' && styles.faded,
          ]}
        >
          {remaining}
        </Text>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onOpen(memory);
              }}
            >
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onExtend(memory, 60 * 60_000);
              }}
            >
              <Text style={styles.menuItemText}>Extend +1 hour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDelete(memory);
              }}
            >
              <Text style={[styles.menuItemText, styles.danger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  primary: { color: colors.ink, fontSize: 16, fontWeight: '500', lineHeight: 22, flex: 1, marginRight: spacing.sm },
  menuBtn: { padding: 4, marginTop: -4, marginRight: -4 },
  menuDots: { color: colors.inkDim, fontSize: 18 },
  created: { color: colors.inkDim, fontSize: 12, marginTop: spacing.sm },
  footer: { marginTop: spacing.md },
  footerLabel: { color: colors.inkDim, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  footerValue: { color: colors.ink, fontSize: 18, fontVariant: ['tabular-nums'], marginTop: 4, fontFamily: 'monospace' },
  danger: { color: colors.danger },
  accent: { color: colors.accent },
  faded: { opacity: 0.4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuCard: {
    width: 200,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  menuItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  menuItemText: { color: colors.ink, fontSize: 14 },
  });
}
