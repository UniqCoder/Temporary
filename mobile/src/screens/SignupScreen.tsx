import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import { useResponsive } from '../hooks/useResponsive';
import { radius, spacing, useTheme, type Palette } from '../theme';

interface Props {
  /** Manual "Go to log in" link tap — safe to navigate directly, this screen is still mounted. */
  onGoLogin: () => void;
  /**
   * Fires after a successful signup that auto-created a session (confirmation
   * disabled). We immediately sign back out so signup never auto-authenticates,
   * but that sign-out flips app-wide auth state, which remounts the navigator —
   * by the time it resolves this screen may already be gone. So this callback
   * must NOT navigate; it only records where to land once the resulting
   * sign-out settles.
   */
  onSignedUpWithSession: () => void;
}

export function SignupScreen({ onGoLogin, onSignedUpWithSession }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { isTablet } = useResponsive();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      if (authError) throw new Error(authError.message);
      if (data.session) {
        // Confirmation is disabled on this Supabase project, so signUp() logs the user
        // in immediately. Sign back out and send them to the login screen instead, per
        // product decision: signup should never auto-authenticate.
        onSignedUpWithSession();
        await supabase.auth.signOut();
        setBusy(false);
      } else {
        setNeedsConfirmation(true);
        setBusy(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
      setBusy(false);
    }
  };

  if (needsConfirmation) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.scroll, styles.form, isTablet && styles.formTablet]}>
          <Logo />
          <Text style={styles.title}>Check your email.</Text>
          <Text style={styles.body}>
            We sent a confirmation link to <Text style={styles.bold}>{email}</Text>. Click it, then come
            back and log in.
          </Text>
          <Pressable onPress={onGoLogin} style={styles.footerRow}>
            <Text style={styles.link}>Go to log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.form, isTablet && styles.formTablet]}>
            <Logo />
            <Text style={styles.title}>Make some room in your memory.</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.inkDim}
              autoComplete="name"
            />

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
              placeholder="At least 8 characters"
              placeholderTextColor={colors.inkDim}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={() => void submit()}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={() => void submit()} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? 'Creating account…' : 'Create account'}</Text>
            </TouchableOpacity>

            <Pressable onPress={onGoLogin} style={styles.footerRow}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.link}>Log in</Text>
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
    title: { color: colors.ink, fontSize: 24, fontWeight: '500', marginTop: spacing.xl, marginBottom: spacing.lg, lineHeight: 30 },
    body: { color: colors.inkDim, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
    bold: { color: colors.ink },
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
