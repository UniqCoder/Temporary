import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MemoryDTO } from '@tm/shared';
import type * as NotificationsType from 'expo-notifications';

const REGISTRY_KEY = '@temporary/notification-registry';
const CHANNEL_ID = 'memory-expiry';
// Fixed at channel-setup time — Android channel color can't react to the live in-app theme.
const CHANNEL_COLOR = '#d8fd51';

type Registry = Record<string, { warningId?: string; forgottenId?: string }>;
type Status = NotificationsType.PermissionStatus | 'unavailable';

let registryCache: Registry | null = null;
let modulePromise: Promise<typeof NotificationsType | null> | null = null;

/**
 * Expo Go on Android throws unconditionally the instant `expo-notifications`
 * is imported (its push-token auto-registration side effect trips Expo Go's
 * "push removed from Expo Go since SDK 53" guard — even though we only ever
 * use *local* notifications here). A static top-level import would crash the
 * whole app on that platform/environment combo, so it's loaded lazily and any
 * failure degrades to "notifications unavailable" instead of a hard crash.
 * Works normally in a real dev/production build, and on iOS Expo Go.
 */
function loadNotifications(): Promise<typeof NotificationsType | null> {
  if (!modulePromise) {
    modulePromise = import('expo-notifications')
      .then((mod) => {
        mod.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
        return mod;
      })
      .catch((err) => {
        console.warn('[notifications] unavailable in this environment:', err instanceof Error ? err.message : err);
        return null;
      });
  }
  return modulePromise;
}

async function loadRegistry(): Promise<Registry> {
  if (registryCache) return registryCache;
  const raw = await AsyncStorage.getItem(REGISTRY_KEY);
  registryCache = raw ? (JSON.parse(raw) as Registry) : {};
  return registryCache;
}

async function saveRegistry(registry: Registry): Promise<void> {
  registryCache = registry;
  await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

/** Call once at app startup. No-op on iOS, where the module failed to load, or where the native side rejects (observed in some Expo Go builds). */
export async function setUpNotificationChannel(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Memory reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: CHANNEL_COLOR,
    });
  } catch (err) {
    console.warn('[notifications] failed to set up notification channel:', err instanceof Error ? err.message : err);
  }
}

export async function getPermissionStatus(): Promise<Status> {
  const Notifications = await loadNotifications();
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (err) {
    console.warn('[notifications] getPermissionsAsync failed:', err instanceof Error ? err.message : err);
    return 'unavailable';
  }
}

export async function requestPermission(): Promise<Status> {
  const Notifications = await loadNotifications();
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (err) {
    console.warn('[notifications] requestPermissionsAsync failed:', err instanceof Error ? err.message : err);
    return 'unavailable';
  }
}

/** Lead time scales with the memory's own lifespan so a 10-minute memory doesn't get a broken 10-minute-early warning. */
function warningLeadMinutes(createdAt: Date, expiresAt: Date): number {
  const totalMinutes = (expiresAt.getTime() - createdAt.getTime()) / 60_000;
  return Math.min(10, Math.max(1, Math.floor(totalMinutes / 2)));
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Schedules the "forgetting soon" warning + the "forgotten" notification. No-ops silently without permission or module support. */
export async function scheduleMemoryNotifications(memory: MemoryDTO): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const createdAt = new Date(memory.createdAt);
    const expiresAt = new Date(memory.expiresAt);
    const now = Date.now();
    const text = truncate(memory.content || memory.title);
    const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

    const entry: Registry[string] = {};

    const leadMinutes = warningLeadMinutes(createdAt, expiresAt);
    const warningAt = new Date(expiresAt.getTime() - leadMinutes * 60_000);
    if (warningAt.getTime() > now) {
      entry.warningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Temporary.',
          body: `Forgetting "${text}" in ${leadMinutes} min.`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: warningAt, channelId },
      });
    }

    if (expiresAt.getTime() > now) {
      entry.forgottenId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Temporary.',
          body: `"${text}" has been forgotten.`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: expiresAt, channelId },
      });
    }

    const registry = await loadRegistry();
    registry[memory.id] = entry;
    await saveRegistry(registry);
  } catch (err) {
    console.warn('[notifications] failed to schedule notifications:', err instanceof Error ? err.message : err);
  }
}

export async function cancelMemoryNotifications(memoryId: string): Promise<void> {
  const Notifications = await loadNotifications();
  const registry = await loadRegistry();
  const entry = registry[memoryId];
  if (!entry) return;
  if (Notifications) {
    try {
      await Promise.all(
        [entry.warningId, entry.forgottenId]
          .filter((id): id is string => !!id)
          .map((id) => Notifications.cancelScheduledNotificationAsync(id)),
      );
    } catch (err) {
      console.warn('[notifications] failed to cancel notifications:', err instanceof Error ? err.message : err);
    }
  }
  delete registry[memoryId];
  await saveRegistry(registry);
}

export async function rescheduleMemoryNotifications(memory: MemoryDTO): Promise<void> {
  await cancelMemoryNotifications(memory.id);
  await scheduleMemoryNotifications(memory);
}

/** Ensures every currently-active memory has a notification pair — covers memories created elsewhere (web) or a fresh install. */
export async function reconcileMemoryNotifications(memories: MemoryDTO[]): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  let status: NotificationsType.PermissionStatus;
  try {
    ({ status } = await Notifications.getPermissionsAsync());
  } catch (err) {
    console.warn('[notifications] getPermissionsAsync failed:', err instanceof Error ? err.message : err);
    return;
  }
  if (status !== 'granted') return;

  const registry = await loadRegistry();
  const activeIds = new Set(memories.map((m) => m.id));

  // Drop registry entries for memories that no longer exist.
  for (const id of Object.keys(registry)) {
    if (!activeIds.has(id)) delete registry[id];
  }
  await saveRegistry(registry);

  const missing = memories.filter((m) => !registry[m.id]);
  await Promise.all(missing.map((m) => scheduleMemoryNotifications(m)));
}
