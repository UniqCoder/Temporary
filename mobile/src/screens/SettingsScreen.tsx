import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api, ApiError, type ApiUser } from '../lib/api';
import { supabase, toApiUser } from '../lib/supabaseClient';
import { getPermissionStatus, requestPermission } from '../lib/notifications';
import { radius, spacing, useTheme, type Palette } from '../theme';
import type * as Notifications from 'expo-notifications';

type NotifStatus = Notifications.PermissionStatus | 'unavailable';

interface Props {
  user: ApiUser;
  onUserUpdate: (user: ApiUser) => void;
  onSignOut: () => void;
}

export function SettingsScreen({ user, onUserUpdate, onSignOut }: Props) {
  const navigation = useNavigation();
  const { mode, colors, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [notifStatus, setNotifStatus] = useState<NotifStatus | null>(null);
  const [requestingNotif, setRequestingNotif] = useState(false);

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void getPermissionStatus().then(setNotifStatus);
  }, []);

  const initials =
    user.name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const trimmed = name.trim();
      if (!trimmed || trimmed === user.name) {
        setMessage('Nothing to save.');
        return;
      }
      const { data, error: updateError } = await supabase.auth.updateUser({ data: { name: trimmed } });
      if (updateError) throw new Error(updateError.message);
      onUserUpdate(toApiUser(data.user));
      setMessage('Saved.');
      setTimeout(() => navigation.goBack(), 550);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const enableNotifications = async () => {
    setRequestingNotif(true);
    const status = await requestPermission();
    setNotifStatus(status);
    setRequestingNotif(false);
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setError(null);
    try {
      await api.deleteAccount();
      await supabase.auth.signOut();
      onSignOut();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete account');
      setDeleteBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Profile */}
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.inkDim} />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.saveRow}>
              <TouchableOpacity onPress={() => void save()} disabled={saving} style={[styles.saveBtn, saving && styles.disabled]}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </View>

          {/* Appearance */}
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.swatchRow}>
            <ThemeSwatch label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} bg="#0d0d0c" accent="#d8fd51" colors={colors} />
            <ThemeSwatch label="Light" active={mode === 'light'} onPress={() => setMode('light')} bg="#f6f3ec" accent="#3f5e33" colors={colors} />
          </View>

          {/* Notifications */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            {notifStatus === 'granted' ? (
              <Text style={styles.body}>You'll be notified before a memory disappears, and when it's forgotten.</Text>
            ) : notifStatus === 'denied' ? (
              <>
                <Text style={styles.body}>Notifications are turned off for this app.</Text>
                <TouchableOpacity onPress={() => void Linking.openSettings()} style={styles.linkBtn}>
                  <Text style={styles.linkBtnText}>Open system settings</Text>
                </TouchableOpacity>
              </>
            ) : notifStatus === 'unavailable' ? (
              <Text style={styles.body}>
                Not available in this preview — notifications need a full build of the app to work.
              </Text>
            ) : (
              <>
                <Text style={styles.body}>Get a heads-up before a memory disappears, and a note when it's gone.</Text>
                <TouchableOpacity
                  onPress={() => void enableNotifications()}
                  disabled={requestingNotif}
                  style={[styles.saveBtn, styles.enableBtn, requestingNotif && styles.disabled]}
                >
                  <Text style={styles.saveText}>{requestingNotif ? 'Requesting…' : 'Enable notifications'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Danger zone */}
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={styles.card}>
            {!deleting ? (
              <TouchableOpacity onPress={() => setDeleting(true)}>
                <Text style={styles.deleteLink}>Delete account</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.deleteWarning}>
                  This permanently deletes your account and every memory. Type DELETE to confirm.
                </Text>
                <TextInput
                  style={styles.input}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="DELETE"
                  placeholderTextColor={colors.inkDim}
                  autoCapitalize="characters"
                />
                <View style={styles.deleteActions}>
                  <TouchableOpacity
                    disabled={confirmText !== 'DELETE' || deleteBusy}
                    onPress={() => void confirmDelete()}
                    style={[styles.confirmDeleteBtn, (confirmText !== 'DELETE' || deleteBusy) && styles.disabled]}
                  >
                    <Text style={styles.confirmDeleteText}>{deleteBusy ? 'Deleting…' : 'Permanently delete'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleting(false)} disabled={deleteBusy} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ThemeSwatch({
  label,
  active,
  onPress,
  bg,
  accent,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  bg: string;
  accent: string;
  colors: Palette;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.swatch, active && styles.swatchActive]}>
      <View style={[styles.swatchPreview, { backgroundColor: bg }]}>
        <View style={[styles.swatchDot, { backgroundColor: accent }]} />
      </View>
      <Text style={styles.swatchLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backIcon: { color: colors.ink, fontSize: 26, fontWeight: '400' },
    headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionLabel: {
      color: colors.inkDim,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.5,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: { color: colors.accentInk, fontSize: 15, fontWeight: '700' },
    profileInfo: { flex: 1 },
    profileEmail: { color: colors.inkDim, fontSize: 13 },
    label: { color: colors.inkDim, fontSize: 12, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.ink,
      fontSize: 14,
    },
    error: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
    saveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    enableBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
    saveText: { color: colors.accentInk, fontSize: 13, fontWeight: '600' },
    message: { color: colors.inkDim, fontSize: 12 },
    disabled: { opacity: 0.5 },
    body: { color: colors.inkDim, fontSize: 13, lineHeight: 19 },
    linkBtn: { marginTop: spacing.sm },
    linkBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    swatchRow: { flexDirection: 'row', gap: spacing.md },
    swatch: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      alignItems: 'center',
    },
    swatchActive: { borderColor: colors.accent, borderWidth: 2 },
    swatchPreview: {
      width: '100%',
      height: 56,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    swatchDot: { width: 20, height: 20, borderRadius: radius.full },
    swatchLabel: { color: colors.ink, fontSize: 13, fontWeight: '500' },
    deleteLink: { color: colors.danger, fontSize: 13 },
    deleteWarning: { color: colors.inkDim, fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
    deleteActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    confirmDeleteBtn: { backgroundColor: colors.danger, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    confirmDeleteText: { color: 'white', fontSize: 13, fontWeight: '600' },
    cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    cancelText: { color: colors.inkDim, fontSize: 13 },
  });
}
