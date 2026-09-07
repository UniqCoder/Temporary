import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ApiUser } from '../lib/api';
import { supabase, toApiUser } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import { useResponsive } from '../hooks/useResponsive';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  onAuthed: (u: ApiUser) => void;
  onGoSignup: () => void;
  justSignedUp?: boolean;
}

export function LoginScreen({ onAuthed, onGoSignup, justSignedUp }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw new Error(authError.message);
      onAuthed(toApiUser(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in');
      setBusy(false);
    }
  };

  const { isTablet } = useResponsive();

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.form, isTablet && styles.formTablet]}>
        <Logo />
        <Text style={styles.title}>Welcome back.</Text>
        {justSignedUp && <Text style={styles.banner}>Account created. Log in to continue.</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.inkDim}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.inkDim}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={() => void submit()}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={() => void submit()} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Logging in…' : 'Log in'}</Text>
        </TouchableOpacity>

        <Pressable onPress={onGoSignup} style={styles.footerRow}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.link}>Sign up</Text>
          </Text>
        </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
    form: { width: '100%' },
    formTablet: { alignSelf: 'center', maxWidth: 420 },
    title: { color: colors.ink, fontSize: 26, fontWeight: '500', marginTop: spacing.xl, marginBottom: spacing.lg },
    banner: {
      color: colors.accentInk,
      backgroundColor: colors.accent,
      fontSize: 13,
      fontWeight: '600',
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    label: { color: colors.inkDim, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.ink,
      fontSize: 15,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      marginTop: spacing.md,
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: colors.accentInk, fontWeight: '600', fontSize: 14 },
    footerRow: { marginTop: spacing.lg },
    footerText: { color: colors.inkDim, fontSize: 13 },
    link: { color: colors.ink, textDecorationLine: 'underline' },
  });
}
