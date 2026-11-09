import { Medication } from '../types';

export const notificationsAvailable = false;
export const enableNotifications = async () => false;
export const notificationsGranted = async () => false;
export const scheduleMedication = async (_username: string, _medication: Medication): Promise<void> => {};
export const cancelMedication = async (_username: string, _id: string): Promise<void> => {};
export const cancelUserReminders = async (_username: string): Promise<void> => {};
export async function testNotification(_username: string): Promise<void> {
  throw new Error('Abrí la app en Expo Go o en Android/iOS para probar las notificaciones.');
}
