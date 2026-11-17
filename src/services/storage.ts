import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, User } from '../types';
import { normalizeUsername, validateAccount } from '../utils/validation';

const USERS = '@atiempo/users/v1';
const SESSION = '@atiempo/session/v1';
const medicationKey = (username: string) => `@atiempo/medications/v1/${normalizeUsername(username)}`;

async function read<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error('No pudimos leer los datos guardados. Volvé a abrir la app.');
  }
}

export async function register(username: string, password: string): Promise<void> {
  const error = validateAccount(username, password);
  if (error) throw new Error(error);
  const users = await read<User[]>(USERS, []);
  const normalized = normalizeUsername(username);
  if (users.some((user) => user.username === normalized)) throw new Error('Ese usuario ya está registrado.');
  await AsyncStorage.setItem(USERS, JSON.stringify([...users, { username: normalized, password }]));
}

export async function authenticate(username: string, password: string): Promise<string> {
  const users = await read<User[]>(USERS, []);
  const user = users.find((item) => item.username === normalizeUsername(username) && item.password === password);
  if (!user) throw new Error('El usuario o la contraseña no son correctos.');
  return user.username;
}

export async function restoreSession(): Promise<string | null> {
  const username = await read<string | null>(SESSION, null);
  if (!username) return null;
  const users = await read<User[]>(USERS, []);
  return users.some((user) => user.username === username) ? username : null;
}

export const saveSession = (username: string) => AsyncStorage.setItem(SESSION, JSON.stringify(username));
export const clearSession = () => AsyncStorage.removeItem(SESSION);
export const loadMedications = (username: string) => read<Medication[]>(medicationKey(username), []);
export const saveMedications = (username: string, medications: Medication[]) =>
  AsyncStorage.setItem(medicationKey(username), JSON.stringify(medications));
