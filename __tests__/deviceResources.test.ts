import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { createCalendarLink, pickContact, pickPhoto } from '../src/services/deviceResources';
import { DevicePermissionError } from '../src/utils/errors';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('expo-calendar', () => ({
  getCalendarPermissions: jest.fn(),
  requestCalendarPermissions: jest.fn(),
  getCalendars: jest.fn(),
  getDefaultCalendarSync: jest.fn(),
  createCalendar: jest.fn(),
  EntityTypes: { EVENT: 'event' },
  SourceType: { LOCAL: 'local' },
  CalendarAccessLevel: { OWNER: 'owner' },
}));

jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  Contact: { presentPicker: jest.fn() },
}));

const mockCopy = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///documents' },
  Directory: jest.fn().mockImplementation((parent, name) => ({
    uri: `${parent}/${name}`,
    create: jest.fn(),
  })),
  File: jest.fn().mockImplementation((parent, name) => ({
    uri: name ? `${parent.uri}/${name}` : parent,
    extension: '.jpg',
    copy: mockCopy,
  })),
}));

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const granted = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' } as const;
const pending = { ...granted, granted: false, status: 'undetermined' } as const;
const blocked = { ...granted, granted: false, canAskAgain: false, status: 'denied' } as const;
const intake = { id: 'toma-1', takenAt: '2026-11-15T11:42:00.000Z' };

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(ImagePicker.getCameraPermissionsAsync).mockResolvedValue(granted as ImagePicker.CameraPermissionResponse);
  jest.mocked(ImagePicker.getMediaLibraryPermissionsAsync).mockResolvedValue(granted as ImagePicker.MediaLibraryPermissionResponse);
  jest.mocked(Contacts.getPermissionsAsync).mockResolvedValue(granted as Contacts.ContactsPermissionResponse);
  jest.mocked(Calendar.getCalendarPermissions).mockResolvedValue(granted as Calendar.PermissionResponse);
});

it('solicita el permiso pendiente antes de abrir la cámara y copia la foto a almacenamiento permanente', async () => {
  jest.mocked(ImagePicker.getCameraPermissionsAsync).mockResolvedValueOnce(pending as ImagePicker.CameraPermissionResponse);
  jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce(granted as ImagePicker.CameraPermissionResponse);
  jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({
    canceled: false, assets: [{ uri: 'file:///cache/foto.jpg', width: 100, height: 100 }],
  });
  const filename = await pickPhoto('camera');
  expect(filename).toMatch(/\.jpg$/);
  expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(mockCopy).toHaveBeenCalledWith(expect.objectContaining({
    uri: `file:///documents/medication-photos/${filename}`,
  }));
});

it('abre la galería con un permiso concedido y conserva la cancelación sin crear archivos', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({ canceled: true, assets: null });
  await expect(pickPhoto('gallery')).resolves.toBeNull();
  expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  expect(File).not.toHaveBeenCalled();
});

it('informa el bloqueo de cámara sin abrirla ni insistir con el permiso', async () => {
  jest.mocked(ImagePicker.getCameraPermissionsAsync).mockResolvedValueOnce(blocked as ImagePicker.CameraPermissionResponse);
  await expect(pickPhoto('camera')).rejects.toEqual(new DevicePermissionError('la cámara', false));
  expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});

it('detiene la galería si el usuario rechaza la solicitud de permiso', async () => {
  jest.mocked(ImagePicker.getMediaLibraryPermissionsAsync).mockResolvedValueOnce(pending as ImagePicker.MediaLibraryPermissionResponse);
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(blocked as ImagePicker.MediaLibraryPermissionResponse);
  await expect(pickPhoto('gallery')).rejects.toThrow('galería');
  expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
});

it('devuelve solo el contacto elegido y respeta la cancelación del selector', async () => {
  const contact = { id: 'contacto-1', getFullName: jest.fn().mockResolvedValue('Contacto de prueba') };
  jest.mocked(Contacts.Contact.presentPicker).mockResolvedValueOnce(contact as unknown as Contacts.Contact);
  await expect(pickContact()).resolves.toEqual({ id: 'contacto-1', name: 'Contacto de prueba' });
  jest.mocked(Contacts.Contact.presentPicker).mockResolvedValueOnce(null);
  await expect(pickContact()).resolves.toBeNull();
});

it('evita abrir la agenda si se deniega el permiso de contactos', async () => {
  jest.mocked(Contacts.getPermissionsAsync).mockResolvedValueOnce(blocked as Contacts.ContactsPermissionResponse);
  await expect(pickContact()).rejects.toThrow('contactos');
  expect(Contacts.Contact.presentPicker).not.toHaveBeenCalled();
});

it('crea un evento con la fecha real de la toma confirmada', async () => {
  const event = { id: 'evento-1', delete: jest.fn().mockResolvedValue(undefined) };
  const createEvent = jest.fn().mockResolvedValue(event);
  jest.mocked(Calendar.getCalendars).mockResolvedValueOnce([]);
  jest.mocked(Calendar.createCalendar).mockResolvedValueOnce({ createEvent } as unknown as Calendar.ExpoCalendar);
  const result = await createCalendarLink({ id: '1', name: 'Medicamento de prueba', time: '08:30', note: '' }, intake);
  expect(Calendar.createCalendar).toHaveBeenCalledWith(expect.objectContaining({
    source: { name: 'Medicacion', type: 'local', isLocalAccount: true },
  }));
  expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Toma registrada de Medicamento de prueba' }));
  const details = createEvent.mock.calls[0][0];
  expect(details.startDate).toEqual(new Date(intake.takenAt));
  expect(details.endDate.getTime() - details.startDate.getTime()).toBe(60000);
  expect(result.link).toEqual({ id: event.id, startsAt: details.startDate.toISOString() });
  await result.undo();
  expect(event.delete).toHaveBeenCalledTimes(1);
});

it('detiene la creación del evento si se bloquea el permiso de calendario', async () => {
  jest.mocked(Calendar.getCalendarPermissions).mockResolvedValueOnce(blocked as Calendar.PermissionResponse);
  await expect(createCalendarLink({ id: '1', name: 'Medicamento de prueba', time: '08:30', note: '' }, intake)).rejects.toThrow('calendario');
  expect(Calendar.getCalendars).not.toHaveBeenCalled();
});

it('rechaza una fecha inválida antes de pedir acceso al calendario', async () => {
  await expect(createCalendarLink({ id: '1', name: 'Medicamento', time: '08:30', note: '' }, {
    id: 'inválida', takenAt: 'sin fecha',
  })).rejects.toThrow('fecha de la toma');
  expect(Calendar.getCalendarPermissions).not.toHaveBeenCalled();
});
