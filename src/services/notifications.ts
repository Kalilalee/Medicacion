import * as Notifications from 'expo-notifications';
import { Medication } from '../types';

const identifier = (username: string, id: string) => `medication:${username}:${id}`;
export const notificationsAvailable = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function enableNotifications(): Promise<boolean> {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return true;
  if (!permission.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    android: {}, ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted;
}

export async function notificationsGranted(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function scheduleMedication(username: string, medication: Medication): Promise<void> {
  const [hour, minute] = medication.time.split(':').map(Number);
  // Expo crea el canal de reserva de Android al presentar un aviso sin channelId.
  await Notifications.scheduleNotificationAsync({
    identifier: identifier(username, medication.id),
    content: { title: 'Es hora de tu recordatorio', body: medication.name, sound: 'default', data: { username } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelMedication(username: string, id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier(username, id));
}

export async function cancelUserReminders(username: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.username === username)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function testNotification(username: string): Promise<void> {
  if (!await enableNotifications()) throw new Error('Activá las notificaciones en los ajustes del celular y volvé a intentar.');
  await Notifications.scheduleNotificationAsync({
    identifier: `test:${username}`,
    content: { title: '¡Tu recordatorio funciona!', body: 'Medicacion te acompaña en tu rutina diaria.', sound: 'default', data: { username } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 },
  });
}
