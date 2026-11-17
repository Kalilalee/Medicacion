import AsyncStorage from '@react-native-async-storage/async-storage';
import * as storage from '../src/services/storage';
import * as notifications from '../src/services/notifications';
import { createCalendarLink, removePhoto } from '../src/services/deviceResources';
import { useMedicationStore } from '../src/stores/medicationStore';

jest.mock('../src/services/notifications', () => ({
  notificationsAvailable: true,
  notificationsGranted: jest.fn(),
  enableNotifications: jest.fn(),
  scheduleMedication: jest.fn(),
  cancelMedication: jest.fn(),
  cancelUserReminders: jest.fn(),
}));

jest.mock('../src/services/deviceResources', () => ({
  createCalendarLink: jest.fn(),
  removePhoto: jest.fn(),
}));

const originalMedication = { id: 'anterior', name: 'Medicamento de prueba', time: '08:00', note: '' };
const draft = { name: 'Nuevo medicamento', time: '14:00', note: 'Nota personal' };

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useMedicationStore.setState(useMedicationStore.getInitialState(), true);
  jest.mocked(notifications.notificationsGranted).mockResolvedValue(true);
  jest.mocked(notifications.enableNotifications).mockResolvedValue(true);
  await storage.register('ana', 'clave123');
  await storage.saveMedications('ana', [originalMedication]);
  await useMedicationStore.getState().login('ana', 'clave123');
});

it('restaura los datos del Parcial 1 y persiste los nuevos recursos al actualizar', async () => {
  const details = {
    photo: 'medicamento.jpg',
    contact: { id: 'contacto-1', name: 'Contacto de prueba' },
  };
  await useMedicationStore.getState().update('anterior', { ...details, name: 'Nombre actualizado' });
  const expected = { ...originalMedication, ...details, name: 'Nombre actualizado' };
  expect(useMedicationStore.getState().medications).toEqual([expected]);
  await expect(storage.loadMedications('ana')).resolves.toEqual([expected]);
});

it('serializa altas simultáneas para conservar todos los medicamentos', async () => {
  await Promise.all([
    useMedicationStore.getState().add(draft),
    useMedicationStore.getState().add({ ...draft, name: 'Otro medicamento' }),
  ]);
  const saved = await storage.loadMedications('ana');
  expect(saved.map((item) => item.name)).toEqual([
    originalMedication.name, draft.name, 'Otro medicamento',
  ]);
  expect(useMedicationStore.getState().medications).toEqual(saved);
});

it('conserva la ficha y su foto cuando falla el guardado de una actualización', async () => {
  await useMedicationStore.getState().update('anterior', { photo: 'anterior.jpg' });
  jest.mocked(removePhoto).mockClear();
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Sin espacio'));
  await expect(useMedicationStore.getState().update('anterior', { photo: 'nueva.jpg' })).rejects.toThrow('Sin espacio');
  expect(useMedicationStore.getState().medications[0].photo).toBe('anterior.jpg');
  expect(removePhoto).not.toHaveBeenCalled();
  await expect(storage.loadMedications('ana')).resolves.toEqual([{ ...originalMedication, photo: 'anterior.jpg' }]);
});

it('guarda el medicamento aunque se deniegue el permiso de notificaciones', async () => {
  jest.mocked(notifications.enableNotifications).mockResolvedValueOnce(false);
  await useMedicationStore.getState().add(draft);
  expect(useMedicationStore.getState().medications).toHaveLength(2);
  expect(useMedicationStore.getState().remindersEnabled).toBe(false);
  expect(useMedicationStore.getState().notice).toContain('Activá las notificaciones');
});

it('guarda el vínculo al evento de una toma confirmada y evita duplicar su exportación', async () => {
  await useMedicationStore.getState().recordIntake('anterior');
  const intake = useMedicationStore.getState().medications[0].intakes![0];
  const link = { id: 'evento-1', startsAt: intake.takenAt };
  jest.mocked(createCalendarLink).mockResolvedValueOnce({ link, undo: jest.fn() });
  await useMedicationStore.getState().addToCalendar('anterior', intake.id);
  await useMedicationStore.getState().addToCalendar('anterior', intake.id);
  expect(createCalendarLink).toHaveBeenCalledTimes(1);
  expect(createCalendarLink).toHaveBeenCalledWith(expect.objectContaining({ id: 'anterior' }), intake);
  expect(useMedicationStore.getState().medications[0].intakes![0].calendarEvent).toEqual(link);
  expect((await storage.loadMedications('ana'))[0].intakes![0].calendarEvent).toEqual(link);
});

it('revierte el evento creado si falla la persistencia y permite volver a intentar', async () => {
  const undo = jest.fn().mockResolvedValue(undefined);
  await useMedicationStore.getState().recordIntake('anterior');
  const intake = useMedicationStore.getState().medications[0].intakes![0];
  const link = { id: 'evento-1', startsAt: intake.takenAt };
  jest.mocked(createCalendarLink).mockResolvedValue({ link, undo });
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Sin espacio'));
  await expect(useMedicationStore.getState().addToCalendar('anterior', intake.id)).rejects.toThrow('Sin espacio');
  expect(undo).toHaveBeenCalledTimes(1);
  expect(useMedicationStore.getState().medications[0].intakes).toEqual([intake]);
  await useMedicationStore.getState().addToCalendar('anterior', intake.id);
  expect(useMedicationStore.getState().medications[0].intakes![0].calendarEvent).toEqual(link);
});

it('registra la hora real, persiste el historial y lo conserva al volver a iniciar sesión', async () => {
  const startedAt = Date.now();
  await useMedicationStore.getState().recordIntake('anterior');
  const [intake] = useMedicationStore.getState().medications[0].intakes!;
  expect(Date.parse(intake.takenAt)).toBeGreaterThanOrEqual(startedAt);
  expect(Date.parse(intake.takenAt)).toBeLessThanOrEqual(Date.now());
  expect((await storage.loadMedications('ana'))[0].intakes).toEqual([intake]);
  expect(createCalendarLink).not.toHaveBeenCalled();
  await useMedicationStore.getState().logout();
  await storage.register('bea', 'clave456');
  await useMedicationStore.getState().login('bea', 'clave456');
  expect(useMedicationStore.getState().medications).toEqual([]);
  await useMedicationStore.getState().logout();
  await useMedicationStore.getState().login('ana', 'clave123');
  expect(useMedicationStore.getState().medications[0].intakes).toEqual([intake]);
});

it('conserva dos tomas registradas a la vez sin perder el historial', async () => {
  await Promise.all([
    useMedicationStore.getState().recordIntake('anterior'),
    useMedicationStore.getState().recordIntake('anterior'),
  ]);
  const intakes = useMedicationStore.getState().medications[0].intakes!;
  expect(intakes).toHaveLength(2);
  expect(intakes[0].id).not.toBe(intakes[1].id);
  expect((await storage.loadMedications('ana'))[0].intakes).toEqual(intakes);
});

it('permite corregir una toma conservando los demás registros y los datos del medicamento', async () => {
  await useMedicationStore.getState().recordIntake('anterior');
  await useMedicationStore.getState().recordIntake('anterior');
  const [first, second] = useMedicationStore.getState().medications[0].intakes!;
  await useMedicationStore.getState().removeIntake('anterior', first.id);
  const expected = { ...originalMedication, intakes: [second] };
  expect(useMedicationStore.getState().medications).toEqual([expected]);
  await expect(storage.loadMedications('ana')).resolves.toEqual([expected]);
});

it('no muestra una toma guardada si falla su persistencia y permite reintentar', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Sin espacio'));
  await expect(useMedicationStore.getState().recordIntake('anterior')).rejects.toThrow('Sin espacio');
  expect(useMedicationStore.getState().medications[0].intakes).toBeUndefined();
  await expect(storage.loadMedications('ana')).resolves.toEqual([originalMedication]);
  await useMedicationStore.getState().recordIntake('anterior');
  expect(useMedicationStore.getState().medications[0].intakes).toHaveLength(1);
});

it('conserva la toma si falla el guardado de una corrección', async () => {
  await useMedicationStore.getState().recordIntake('anterior');
  const intake = useMedicationStore.getState().medications[0].intakes![0];
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Sin espacio'));
  await expect(useMedicationStore.getState().removeIntake('anterior', intake.id)).rejects.toThrow('Sin espacio');
  expect(useMedicationStore.getState().medications[0].intakes).toEqual([intake]);
  expect((await storage.loadMedications('ana'))[0].intakes).toEqual([intake]);
});

it('requiere una toma registrada para exportar al calendario', async () => {
  await expect(useMedicationStore.getState().addToCalendar('anterior', 'inexistente')).rejects.toThrow('Registrá una toma');
  expect(createCalendarLink).not.toHaveBeenCalled();
  expect(useMedicationStore.getState().medications[0].intakes).toBeUndefined();
});

it('restaura el aviso y conserva la ficha si falla la persistencia de una eliminación', async () => {
  jest.mocked(notifications.scheduleMedication).mockClear();
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Sin espacio'));
  await expect(useMedicationStore.getState().remove('anterior')).rejects.toThrow('Sin espacio');
  expect(useMedicationStore.getState().medications).toEqual([originalMedication]);
  expect(notifications.scheduleMedication).toHaveBeenCalledWith('ana', originalMedication);
  expect(removePhoto).not.toHaveBeenCalled();
});

it('conserva la sesión y restaura sus avisos si falla el cierre de sesión', async () => {
  jest.mocked(notifications.scheduleMedication).mockClear();
  jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Error de almacenamiento'));
  await expect(useMedicationStore.getState().logout()).rejects.toThrow('Error de almacenamiento');
  expect(useMedicationStore.getState().username).toBe('ana');
  await expect(storage.restoreSession()).resolves.toBe('ana');
  expect(notifications.scheduleMedication).toHaveBeenCalledWith('ana', originalMedication);
});

it('restaura los recursos al volver a ingresar y mantiene separados los datos de otra cuenta', async () => {
  await useMedicationStore.getState().update('anterior', { photo: 'medicamento.jpg' });
  await useMedicationStore.getState().logout();
  await storage.register('bea', 'clave456');
  await useMedicationStore.getState().login('bea', 'clave456');
  expect(useMedicationStore.getState().medications).toEqual([]);
  await useMedicationStore.getState().logout();
  await useMedicationStore.getState().login('ana', 'clave123');
  expect(useMedicationStore.getState().medications).toEqual([{ ...originalMedication, photo: 'medicamento.jpg' }]);
});
