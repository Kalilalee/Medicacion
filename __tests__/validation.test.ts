import { nextReminder, normalizeUsername, reminderDay, validateAccount, validateMedication } from '../src/utils/validation';

describe('Validación de datos y horarios', () => {
  it('normaliza el usuario para evitar cuentas duplicadas por mayúsculas', () => {
    expect(normalizeUsername('  Ana_12 ')).toBe('ana_12');
  });
  it('rechaza usuarios inválidos y contraseñas cortas', () => {
    expect(validateAccount('an', '123456')).toBeTruthy();
    expect(validateAccount('ana', '123')).toBeTruthy();
    expect(validateAccount('ana', '123456')).toBeNull();
  });
  it.each(['24:00', '08:60', '8:00', 'mañana'])('rechaza la hora inválida %s', (time) => {
    expect(validateMedication({ name: 'Mi medicación', time, note: '' })).toBeTruthy();
  });
  it('requiere un nombre y permite medianoche', () => {
    expect(validateMedication({ name: ' ', time: '08:00', note: '' })).toBeTruthy();
    expect(validateMedication({ name: 'Mi medicación', time: '00:00', note: '' })).toBeNull();
  });
  it('calcula la siguiente hora en el día y pasa a mañana al superar el horario', () => {
    const now = new Date(2026, 10, 2, 8, 30);
    expect(nextReminder('09:00', now)).toEqual(new Date(2026, 10, 2, 9));
    expect(nextReminder('08:00', now)).toEqual(new Date(2026, 10, 3, 8));
    expect(reminderDay('08:00', now)).toBe('Mañana');
    expect(reminderDay('09:00', now)).toBe('Hoy');
  });
  it('maneja correctamente el cambio de mes sin modificar la fecha original', () => {
    const now = new Date(2026, 0, 31, 23, 59);
    expect(nextReminder('00:00', now)).toEqual(new Date(2026, 1, 1));
    expect(now.getMonth()).toBe(0);
  });
});
