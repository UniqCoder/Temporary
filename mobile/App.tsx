import 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ApiUser } from './src/lib/api';
import { supabase, toApiUser } from './src/lib/supabaseClient';
import { setUpNotificationChannel } from './src/lib/notifications';
import { ThemeProvider, useTheme } from './src/theme';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppShell() {
  const { mode, colors } = useTheme();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [ready, setReady] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // Where to land when signed out — a plain ref (not state) so it's visible
  // synchronously to the auth-transition effect below, with no batching race
  // against the sign-out that triggers that transition.
  const signedOutDestRef = useRef<'Onboarding' | 'Login'>('Onboarding');
  const wasAuthedRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    void setUpNotificationChannel();
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session ? toApiUser(session.user) : null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session ? toApiUser(session.user) : null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // The navigator below is always fully mounted — screens never conditionally
  // appear/disappear based on auth state, since swapping which routes exist
  // remounts the whole stack and can strand an in-flight navigation call from
  // a screen that's mid-unmount (e.g. signup's transient sign-in-then-out
  // flicker). Auth transitions are instead driven imperatively through a ref,
  // once, exactly on the truthy/falsy edge.
  useEffect(() => {
    if (!ready) return;
    const isAuthed = !!user;
    if (wasAuthedRef.current === undefined) {
      wasAuthedRef.current = isAuthed;
      return;
    }
    if (wasAuthedRef.current === isAuthed) return;
    wasAuthedRef.current = isAuthed;
    if (!navigationRef.isReady()) return;
    navigationRef.reset({
      index: 0,
      routes: [{ name: isAuthed ? 'Home' : signedOutDestRef.current }],
    });
    // Only clear once actually consumed (the !isAuthed branch) — the interstitial
    // SIGNED_IN-to-Home reset during signup's sign-in-then-out flicker must not
    // wipe this before the follow-up SIGNED_OUT reset gets to read it.
    if (!isAuthed) signedOutDestRef.current = 'Onboarding';
  }, [user, ready]);

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: { ...(mode === 'dark' ? DarkTheme : DefaultTheme).colors, background: colors.background, card: colors.background },
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.inkDim} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={user ? 'Home' : 'Onboarding'}>
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onDone={(dest) => navigation.navigate(dest === 'signup' ? 'Signup' : 'Login')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onAuthed={(u) => {
                  setJustSignedUp(false);
                  setUser(u);
                }}
                onGoSignup={() => navigation.navigate('Signup')}
                justSignedUp={justSignedUp}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup">
            {({ navigation }) => (
              <SignupScreen
                onGoLogin={() => navigation.navigate('Login')}
                onSignedUpWithSession={() => {
                  // Set before the sign-out (which flips app-wide auth state and
                  // remounts the navigator) fires — the auth-transition effect
                  // above reads this once that settles, rather than this screen
                  // navigating through its own (about to be stale) nav object.
                  signedOutDestRef.current = 'Login';
                  setJustSignedUp(true);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Home">
            {() => (user ? <HomeScreen user={user} onSignOut={() => setUser(null)} /> : null)}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {() => (user ? <SettingsScreen user={user} onUserUpdate={setUser} onSignOut={() => setUser(null)} /> : null)}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
