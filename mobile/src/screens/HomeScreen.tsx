import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ApiUser, MemoryDTO } from '@tm/shared';
import { EXPIRY_CHOICES, formatExpiryFull } from '@tm/shared';
import type { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabaseClient';
import { toMemoryFields } from '../lib/memoryText';
import { getPermissionStatus, requestPermission } from '../lib/notifications';
import { useMemories, filterMemories } from '../hooks/useMemories';
import { useNow } from '../hooks/useNow';
import { useResponsive } from '../hooks/useResponsive';
import { Logo } from '../components/Logo';
import { ExpiryChips } from '../components/ExpiryChips';
import { CustomDateTimeSheet } from '../components/CustomDateTimeSheet';
import { MemoryCard } from '../components/MemoryCard';
import { MemoryDetailModal } from '../components/MemoryDetailModal';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  user: ApiUser;
  onSignOut: () => void;
}

export function HomeScreen({ user, onSignOut }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { memories, loading, loadError, reload, create, update, extend, remove, scheduleExpiryRefresh } =
    useMemories();

  const [text, setText] = useState('');
  const [expiryKey, setExpiryKey] = useState('tonight');
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMemory, setOpenMemory] = useState<MemoryDTO | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const now = useNow(1000);
  const { isTablet } = useResponsive();
  const numColumns = isTablet ? 2 : 1;

  useEffect(() => scheduleExpiryRefresh(now), [scheduleExpiryRefresh, now]);

  const openLive = useMemo(
    () => memories.find((m) => m.id === openMemory?.id) ?? null,
    [memories, openMemory],
  );

  const filtered = useMemo(() => filterMemories(memories, query), [memories, query]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const resolvedExpiry = useMemo(() => {
    if (expiryKey === 'custom' && customDate) return customDate;
    const choice = EXPIRY_CHOICES.find((c) => c.key === expiryKey);
    return choice ? choice.compute(new Date()) : new Date(Date.now() + 2 * 3_600_000);
  }, [expiryKey, customDate]);

  const selectExpiry = (key: string) => {
    if (key === 'custom') {
      setShowCustomPicker(true);
      return;
    }
    setExpiryKey(key);
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      // Ask once, in context, the first time someone captures a memory — never re-prompt after a denial.
      if ((await getPermissionStatus()) === 'undetermined') {
        await requestPermission();
      }
      const { title, content } = toMemoryFields(trimmed);
      await create({ title, content, source: 'text', expiresAt: resolvedExpiry.toISOString() });
      setText('');
      showToast('Kept. It will forget itself.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } finally {
      onSignOut();
    }
  };

  const initials =
    user.name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Logo size="sm" />
          <TouchableOpacity style={styles.avatar} onPress={() => setMenuOpen((v) => !v)}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {menuOpen && (
          <View style={styles.menuCard}>
            <Text style={styles.menuName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.menuEmail} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => void handleLogout()}>
              <Text style={styles.menuItemText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          key={numColumns}
          data={filtered}
          keyExtractor={(m) => m.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={[styles.listContent, isTablet && styles.listContentTablet]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={isTablet && styles.headerTablet}>
              <Text style={styles.h1}>Your memories</Text>
              <Text style={styles.subtitle}>Things you need right now. Nothing permanent.</Text>

              <View style={styles.captureCard}>
                <TextInput
                  style={styles.captureInput}
                  value={text}
                  onChangeText={setText}
                  placeholder="Write now, forget later."
                  placeholderTextColor={colors.inkDim}
                  multiline
                />
                <View style={styles.captureRow}>
                  <ExpiryChips selectedKey={expiryKey} onSelect={selectExpiry} />
                </View>
                {expiryKey === 'custom' && customDate && (
                  <Text style={styles.customChosen}>Forgets at {formatExpiryFull(customDate.toISOString())}</Text>
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  style={[styles.addBtn, (!text.trim() || busy) && styles.disabled]}
                  disabled={!text.trim() || busy}
                  onPress={() => void submit()}
                >
                  <Text style={styles.addBtnText}>{busy ? 'Saving…' : 'Add memory'}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search memories"
                placeholderTextColor={colors.inkDim}
              />
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.inkDim} style={styles.loading} />
            ) : loadError ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.loadErrorText}>{loadError}</Text>
                <TouchableOpacity onPress={() => void reload()} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : query ? (
              <Text style={styles.emptyQuery}>Nothing matches "{query}".</Text>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Nothing to remember.</Text>
                <Text style={styles.emptySubtitle}>For now.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : undefined}>
              <MemoryCard
                memory={item}
                onOpen={setOpenMemory}
                onExtend={(m, ms) => {
                  void extend(m.id, ms).then(() => showToast('Kept a little longer.'));
                }}
                onDelete={(m) => {
                  void remove(m.id).then(() => showToast('Forgotten.'));
                }}
              />
            </View>
          )}
        />

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <CustomDateTimeSheet
        visible={showCustomPicker}
        initialDate={customDate ?? new Date(Date.now() + 60 * 60_000)}
        onCancel={() => setShowCustomPicker(false)}
        onConfirm={(date) => {
          setCustomDate(date);
          setExpiryKey('custom');
          setShowCustomPicker(false);
        }}
      />

      <MemoryDetailModal
        memory={openLive}
        onClose={() => setOpenMemory(null)}
        onSave={async (id, input) => {
          await update(id, input);
          showToast('Updated.');
        }}
        onExtend={async (id, ms) => {
          await extend(id, ms);
          showToast('Kept a little longer.');
        }}
        onDelete={async (id) => {
          await remove(id);
          setOpenMemory(null);
          showToast('Forgotten.');
        }}
      />
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
      paddingVertical: spacing.md,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
    menuCard: {
      position: 'absolute',
      top: 60,
      right: spacing.lg,
      zIndex: 10,
      width: 220,
      backgroundColor: colors.cardAlt,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    menuName: { color: colors.ink, fontSize: 15, fontWeight: '600', marginTop: 4 },
    menuEmail: { color: colors.inkDim, fontSize: 12, marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    menuItem: { paddingVertical: spacing.sm },
    menuItemText: { color: colors.ink, fontSize: 13 },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    listContentTablet: { maxWidth: 900, width: '100%', alignSelf: 'center' },
    headerTablet: { width: '100%' },
    row: { gap: spacing.md },
    gridItem: { flex: 1 },
    h1: { color: colors.ink, fontSize: 26, fontWeight: '500', marginTop: spacing.md },
    subtitle: { color: colors.inkDim, fontSize: 14, marginTop: 4, marginBottom: spacing.lg },
    captureCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    captureInput: { color: colors.ink, fontSize: 16, minHeight: 44, textAlignVertical: 'top' },
    captureRow: { marginTop: spacing.md },
    customChosen: { color: colors.accent, fontSize: 12, marginTop: spacing.sm },
    errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    addBtnText: { color: colors.accentInk, fontSize: 13, fontWeight: '600' },
    disabled: { opacity: 0.3 },
    search: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.ink,
      fontSize: 14,
      marginBottom: spacing.md,
    },
    loading: { marginTop: spacing.xxl },
    emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '500' },
    emptySubtitle: { color: colors.inkDim, fontSize: 14, marginTop: 4 },
    emptyQuery: { color: colors.inkDim, fontSize: 14, textAlign: 'center', paddingVertical: spacing.xxl },
    loadErrorText: { color: colors.danger, fontSize: 14 },
    retryBtn: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    retryText: { color: colors.ink, fontSize: 13 },
    toast: {
      position: 'absolute',
      bottom: spacing.xl,
      alignSelf: 'center',
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    toastText: { color: colors.ink, fontSize: 13 },
  });
}
