import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Foreground behavior: show an alert + sound even if the app is open
// when the reminder fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Call once on app start (Android only needs this, but harmless elsewhere).
 * Required for notifications to show properly on Android 8+.
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Returns true if permission is granted (asking the user if needed). */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Schedules a daily repeating local notification at the given time,
 * replacing any previously scheduled reminder.
 */
export async function scheduleDailyReminder(hour, minute, title, body) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}