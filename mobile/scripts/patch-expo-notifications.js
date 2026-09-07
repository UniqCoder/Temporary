// expo-notifications auto-registers a push-token listener as a module-load
// side effect (DevicePushTokenAutoRegistration.fx.js), even for apps that
// never touch push notifications. Upstream throws on Android inside Expo Go
// for this (SDK 53+ removed remote push there) — but we only use *local*
// notifications, which don't need push at all. This neutralizes the throw
// (matching iOS's warn-and-continue behavior) so Expo Go keeps working.
//
// Re-run automatically via the "postinstall" script whenever node_modules is
// reinstalled, since a plain `npm install` would otherwise overwrite this.
const fs = require('fs');

function patchPushUsageWarning() {
  const target = require.resolve('expo-notifications/build/warnOfExpoGoPushUsage.js');
  const original = fs.readFileSync(target, 'utf8');

  const throwing = `if (Platform.OS === 'android') {\n            throw new Error(message);\n        }\n        else if (__DEV__) {`;

  if (!original.includes(throwing)) {
    console.log('[patch-expo-notifications] warnOfExpoGoPushUsage: already applied (or upstream changed) — nothing to do.');
    return;
  }

  const patched = original.replace(throwing, `if (__DEV__) {`);
  fs.writeFileSync(target, patched, 'utf8');
  console.log('[patch-expo-notifications] warnOfExpoGoPushUsage: applied.');
}

function patchTopicSubscriptionModule() {
  const target = require.resolve('expo-notifications/build/TopicSubscriptionModule.android.js');
  const original = fs.readFileSync(target, 'utf8');

  const eager = `export default requireNativeModule('ExpoTopicSubscriptionModule');`;

  if (!original.includes(eager)) {
    console.log('[patch-expo-notifications] TopicSubscriptionModule: already applied (or upstream changed) — nothing to do.');
    return;
  }

  const patched = original.replace(
    eager,
    `let nativeModule;\ntry {\n    nativeModule = requireNativeModule('ExpoTopicSubscriptionModule');\n}\ncatch (e) {\n    nativeModule = {};\n}\nexport default nativeModule;`,
  );
  fs.writeFileSync(target, patched, 'utf8');
  console.log('[patch-expo-notifications] TopicSubscriptionModule: applied.');
}

patchPushUsageWarning();
patchTopicSubscriptionModule();
