import * as Notifications from 'expo-notifications';
import { cancelMedication, cancelUserReminders, scheduleMedication, testNotification } from '../src/services/notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(), cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));

beforeEach(() => jest.clearAllMocks());

it('programa un aviso diario con la hora y un identificador estable por usuario', async () => {
  await scheduleMedication('ana', { id: '1', name: 'Mi medicación', time: '21:30', note: '' });
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    identifier: 'medication:ana:1',
    trigger: { type: 'daily', hour: 21, minute: 30 },
    content: expect.objectContaining({ body: 'Mi medicación', data: { username: 'ana' } }),
  }));
});

it('programa la demostración a diez segundos cuando hay permiso', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Notifications.NotificationPermissionsStatus);
  await testNotification('ana');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    trigger: { type: 'timeInterval', seconds: 10 },
  }));
});

it('no programa una notificación si el permiso está denegado', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: false } as Notifications.NotificationPermissionsStatus);
  await expect(testNotification('ana')).rejects.toThrow('ajustes');
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('solicita permiso cuando se puede preguntar y programa el aviso al concederlo', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: true } as Notifications.NotificationPermissionsStatus);
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ granted: true } as Notifications.NotificationPermissionsStatus);
  await testNotification('ana');
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
    android: {}, ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('cancela el recordatorio de una medicación eliminada', async () => {
  await cancelMedication('ana', '1');
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('medication:ana:1');
});

it('al salir cancela solo los recordatorios de esa cuenta', async () => {
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
    { identifier: 'medication:ana:1', content: { data: { username: 'ana' } } },
    { identifier: 'medication:otro:2', content: { data: { username: 'otro' } } },
  ] as unknown as Notifications.NotificationRequest[]);
  await cancelUserReminders('ana');
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('medication:ana:1');
});
