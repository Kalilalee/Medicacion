import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { CalendarLink, Medication, MedicationContact, MedicationIntake } from '../types';
import { colors } from '../theme';
import { DevicePermissionError } from '../utils/errors';

export const deviceResourcesAvailable = true;
export const calendarAvailable = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type Permission = { granted: boolean; canAskAgain: boolean };

async function requirePermission(
  resource: string,
  check: () => Promise<Permission>,
  request: () => Promise<Permission>,
) {
  let permission = await check();
  if (!permission.granted && permission.canAskAgain) permission = await request();
  if (!permission.granted) throw new DevicePermissionError(resource, permission.canAskAgain);
}

function photoDirectory() {
  return new Directory(Paths.document, 'medication-photos');
}

export function photoUri(filename: string) {
  return new File(photoDirectory(), filename).uri;
}

export function removePhoto(filename?: string) {
  if (!filename) return;
  try {
    const file = new File(photoDirectory(), filename);
    if (file.exists) file.delete();
  } catch {
    // La ficha ya se guardó. Un fallo de limpieza no revierte el cambio.
  }
}

export async function pickPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
  if (source === 'camera') {
    await requirePermission('la cámara', ImagePicker.getCameraPermissionsAsync, ImagePicker.requestCameraPermissionsAsync);
  } else {
    await requirePermission('la galería', ImagePicker.getMediaLibraryPermissionsAsync, ImagePicker.requestMediaLibraryPermissionsAsync);
  }
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;

  const original = new File(result.assets[0].uri);
  const folder = photoDirectory();
  folder.create({ idempotent: true, intermediates: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${original.extension}`;
  await original.copy(new File(folder, filename));
  return filename;
}

export async function pickContact(): Promise<MedicationContact | null> {
  await requirePermission('los contactos', Contacts.getPermissionsAsync, Contacts.requestPermissionsAsync);
  const contact = await Contacts.Contact.presentPicker();
  if (!contact) return null;
  const name = await contact.getFullName();
  return { id: contact.id, name: name || 'Contacto sin nombre' };
}

async function calendarPermission() {
  if (!calendarAvailable) throw new Error('Abrí la versión instalada de Medicacion para usar el calendario.');
  await requirePermission('el calendario', Calendar.getCalendarPermissions, Calendar.requestCalendarPermissions);
}

async function getMedicationCalendar() {
  if (Platform.OS === 'ios') return Calendar.getDefaultCalendarSync();

  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((item) => item.name === 'medicacion' && item.source?.isLocalAccount);
  if (existing) return existing;
  return Calendar.createCalendar({
    name: 'medicacion',
    title: 'Medicacion',
    color: colors.primary,
    entityType: Calendar.EntityTypes.EVENT,
    source: { name: 'Medicacion', type: Calendar.SourceType.LOCAL, isLocalAccount: true },
    ownerAccount: 'Medicacion',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function createCalendarLink(medication: Medication, intake: MedicationIntake): Promise<{ link: CalendarLink; undo: () => Promise<void> }> {
  const start = new Date(intake.takenAt);
  if (!Number.isFinite(start.getTime())) throw new Error('La fecha de la toma no es válida.');
  await calendarPermission();
  const calendar = await getMedicationCalendar();
  const event = await calendar.createEvent({
    title: `Toma registrada de ${medication.name}`,
    startDate: start,
    endDate: new Date(start.getTime() + 60000),
  });
  return { link: { id: event.id, startsAt: start.toISOString() }, undo: () => event.delete() };
}

export async function openCalendarLink(id: string): Promise<void> {
  await calendarPermission();
  const event = await Calendar.ExpoCalendarEvent.get(id);
  await event.openInCalendar();
}
