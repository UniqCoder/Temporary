import { useEffect, useMemo, useState } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  visible: boolean;
  initialDate: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

/**
 * Platform-appropriate custom date+time picker. iOS gets an inline spinner
 * sheet (its native picker supports a combined date+time mode). Android has
 * no combined widget and the *component* API is documented upstream as
 * "more prone to introducing bugs" there — so Android uses the recommended
 * imperative DateTimePickerAndroid.open(), chaining date then time dialogs.
 */
export function CustomDateTimeSheet({ visible, initialDate, onCancel, onConfirm }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState(initialDate);

  useEffect(() => {
    if (visible) setDraft(initialDate);
  }, [visible, initialDate]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    DateTimePickerAndroid.open({
      value: initialDate,
      mode: 'date',
      minimumDate: new Date(),
      onValueChange: (_event, pickedDate) => {
        if (!pickedDate) {
          onCancel();
          return;
        }
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onValueChange: (_e, pickedTime) => {
            if (!pickedTime) {
              onCancel();
              return;
            }
            const merged = new Date(pickedDate);
            merged.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            onConfirm(merged);
          },
          onDismiss: onCancel,
        });
      },
      onDismiss: onCancel,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || Platform.OS === 'android') return null;

  // iOS: inline bottom-sheet spinner, confirmed explicitly (no native dismiss-on-select).
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.label}>Choose date & time</Text>
          <DateTimePicker
            value={draft}
            mode="datetime"
            display="spinner"
            minimumDate={new Date()}
            onValueChange={(_, selected) => selected && setDraft(selected)}
            textColor={colors.ink}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(draft)} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Set reminder</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { color: colors.inkDim, fontSize: 13, marginBottom: spacing.sm, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    cancelBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    cancelText: { color: colors.inkDim, fontSize: 14 },
    confirmBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.accent },
    confirmText: { color: colors.accentInk, fontSize: 14, fontWeight: '600' },
  });
}
