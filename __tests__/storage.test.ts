import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticate, clearSession, loadMedications, register, restoreSession, saveMedications, saveSession } from '../src/services/storage';

beforeEach(async () => { await AsyncStorage.clear(); });

it('registra, normaliza y autentica una cuenta; rechaza contraseña incorrecta', async () => {
  await register('  Ana ', 'clave123');
  await expect(authenticate('ANA', 'clave123')).resolves.toBe('ana');
  await expect(authenticate('ana', 'incorrecta')).rejects.toThrow('no son correctos');
  await expect(register('ANA', 'clave456')).rejects.toThrow('ya está registrado');
});

it('restaura la sesión guardada y la elimina al salir', async () => {
  await register('ana', 'clave123');
  await saveSession('ana');
  await expect(restoreSession()).resolves.toBe('ana');
  await clearSession();
  await expect(restoreSession()).resolves.toBeNull();
});

it('no restaura una sesión sin una cuenta registrada', async () => {
  await saveSession('inexistente');
  await expect(restoreSession()).resolves.toBeNull();
});

it('persiste las medicaciones y mantiene separadas las cuentas', async () => {
  const items = [{ id: '1', name: 'Mi medicación', time: '08:00', note: '' }];
  await saveMedications('ana', items);
  await expect(loadMedications('ana')).resolves.toEqual(items);
  await expect(loadMedications('otro')).resolves.toEqual([]);
  await saveMedications('ana', []);
  await expect(loadMedications('ana')).resolves.toEqual([]);
});

it('informa un almacenamiento corrupto sin sobrescribirlo', async () => {
  await AsyncStorage.setItem('@atiempo/users/v1', 'json roto');
  await expect(register('ana', 'clave123')).rejects.toThrow('leer los datos');
  await expect(AsyncStorage.getItem('@atiempo/users/v1')).resolves.toBe('json roto');
});
