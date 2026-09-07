import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { MemoryDTO } from '@tm/shared';
import { formatCreated, formatExpiryFull, formatRemaining, EXPIRY_CHOICES } from '@tm/shared';
import { useNow } from '../hooks/useNow';
import { toMemoryFields } from '../lib/memoryText';
import { CustomDateTimeSheet } from './CustomDateTimeSheet';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  memory: MemoryDTO | null;
  onClose: () => void;
  onSave: (id: string, input: { title: string; content: string; expiresAt?: string }) => Promise<void>;
  onExtend: (id: string, durationMs: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** No separate title field — editing the memory means editing its text. */
export function MemoryDetailModal({ memory, onClose, onSave, onExtend, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [newExpiry, setNewExpiry] = useState<Date | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const now = useNow(1000);

  useEffect(() => {
    if (memory) {
      setDraftText(memory.content || memory.title);
      setEditing(false);
      setConfirmDelete(false);
      setNewExpiry(null);
    }
  }, [memory?.id]);

  if (!memory) return null;
  const remaining = formatRemaining(memory.expiresAt, now);
  const primaryText = memory.content || memory.title;

  const save = async () => {
    setBusy(true);
    try {
      const { title, content } = toMemoryFields(draftText);
      await onSave(memory.id, {
        title,
        content,
        expiresAt: newExpiry ? newExpiry.toISOString() : undefined,
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!memory} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoidWrap}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {!editing ? (
              <>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{primaryText}</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={10}>
                    <Text style={styles.close}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>CREATED</Text>
                    <Text style={styles.metaValue}>{formatCreated(memory.createdAt)}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>FORGETS AT</Text>
                    <Text style={styles.metaValue}>{formatExpiryFull(memory.expiresAt)}</Text>
                  </View>
                </View>

                <View style={styles.remainingRow}>
                  <View>
                    <Text style={styles.metaLabel}>FORGETS IN</Text>
                    <Text style={styles.remaining}>{remaining}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setEditing(true)}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => void onExtend(memory.id, 60 * 60_000)}
                  >
                    <Text style={styles.actionText}>+1h</Text>
                  </TouchableOpacity>
                  {!confirmDelete ? (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setConfirmDelete(true)}>
                      <Text style={[styles.actionText, styles.danger]}>Delete</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.confirmDeleteBtn]}
                      onPress={() => void onDelete(memory.id)}
                    >
                      <Text style={styles.confirmDeleteText}>Confirm delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <ScrollView style={styles.editScroll} contentContainerStyle={styles.editScrollContent}>
                <Text style={styles.title}>Edit memory</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={draftText}
                  onChangeText={setDraftText}
                  multiline
                  placeholderTextColor={colors.inkDim}
                  autoFocus
                />
                <Text style={styles.label}>Reminder</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {EXPIRY_CHOICES.map((choice) => (
                    <TouchableOpacity
                      key={choice.key}
                      style={styles.chip}
                      onPress={() =>
                        choice.key === 'custom' ? setShowCustomPicker(true) : setNewExpiry(choice.compute(new Date()))
                      }
                    >
                      <Text style={styles.chipText}>{choice.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {newExpiry && (
                  <Text style={styles.customChosen}>Forgets at {formatExpiryFull(newExpiry.toISOString())}</Text>
                )}

                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void save()}
                    disabled={busy}
                    style={[styles.saveBtn, busy && styles.disabled]}
                  >
                    <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save changes'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      <CustomDateTimeSheet
        visible={showCustomPicker}
        initialDate={newExpiry ?? new Date(Date.now() + 60 * 60_000)}
        onCancel={() => setShowCustomPicker(false)}
        onConfirm={(date) => {
          setNewExpiry(date);
          setShowCustomPicker(false);
        }}
      />
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    // flex: 1 gives this a definite height (matching the flex:1 backdrop) so
    // that `card`'s maxHeight: '85%' below has something real to resolve
    // against — a percentage height is otherwise ignored against a
    // content-sized ancestor.
    avoidWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    card: {
      width: 380,
      maxWidth: '100%',
      maxHeight: '85%',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      overflow: 'hidden',
    },
    // React Native's default flexShrink is 0 (unlike web CSS), so without this
    // the ScrollView measures to its full content height instead of respecting
    // `card`'s maxHeight — on Android that overflow isn't clipped or
    // scrollable, it just renders past the card, putting Save/Cancel out of
    // the tappable area entirely.
    editScroll: { flexShrink: 1 },
    editScrollContent: { paddingBottom: spacing.sm },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { color: colors.ink, fontSize: 19, fontWeight: '500', lineHeight: 26, flex: 1, marginRight: spacing.md },
    close: { color: colors.inkDim, fontSize: 18 },
    metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
    metaCol: { flex: 1 },
    metaLabel: { color: colors.inkDim, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
    metaValue: { color: colors.ink, fontSize: 13, marginTop: 4 },
    remainingRow: { marginTop: spacing.lg },
    remaining: { color: colors.accent, fontSize: 24, fontFamily: 'monospace', marginTop: 4 },
    actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
    actionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
    actionText: { color: colors.inkDim, fontSize: 13 },
    danger: { color: colors.danger },
    confirmDeleteBtn: { backgroundColor: colors.danger, borderRadius: radius.sm },
    confirmDeleteText: { color: 'white', fontSize: 13, fontWeight: '600' },
    label: { color: colors.inkDim, fontSize: 12, marginTop: spacing.lg, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.ink,
      fontSize: 15,
      marginTop: spacing.md,
    },
    textarea: { minHeight: 100, textAlignVertical: 'top' },
    chipsRow: { gap: 6, marginTop: 4 },
    chip: { backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
    chipText: { color: colors.inkDim, fontSize: 12 },
    customChosen: { color: colors.accent, fontSize: 12, marginTop: spacing.sm },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xl },
    cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    cancelText: { color: colors.inkDim, fontSize: 13 },
    saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    saveText: { color: colors.accentInk, fontSize: 13, fontWeight: '600' },
    disabled: { opacity: 0.5 },
  });
}
