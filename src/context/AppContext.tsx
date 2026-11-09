import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Medication, MedicationDraft } from '../types';
import * as storage from '../services/storage';
import * as notifications from '../services/notifications';
import { validateMedication } from '../utils/validation';

type AppState = {
  username: string | null; medications: Medication[]; ready: boolean; startupError: string;
  notice: string; dismissNotice: () => void; remindersEnabled: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>; add: (draft: MedicationDraft) => Promise<void>;
  remove: (id: string) => Promise<void>; enableReminders: () => Promise<void>;
  retry: () => void;
};
const AppContext = createContext<AppState | null>(null);
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No pudimos completar la operación. Volvé a intentar.';

export function AppProvider({ children }: PropsWithChildren) {
  const [username, setUsername] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState('');
  const [notice, setNotice] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function synchronize(user: string, items: Medication[]) {
    const granted = await notifications.notificationsGranted();
    setRemindersEnabled(granted);
    if (granted) await Promise.all(items.map((item) => notifications.scheduleMedication(user, item)));
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const user = await storage.restoreSession();
        const items = user ? await storage.loadMedications(user) : [];
        if (!mounted) return;
        setUsername(user); setMedications(items); setStartupError('');
        if (user) {
          try { await synchronize(user, items); }
          catch { if (mounted) setNotice('Tus datos están guardados, pero no pudimos activar los recordatorios. Volvé a intentar.'); }
        }
      } catch (error) { if (mounted) setStartupError(errorMessage(error)); }
      finally { if (mounted) setReady(true); }
    }
    void boot();
    return () => { mounted = false; };
  }, [attempt]);

  async function login(name: string, password: string) {
    const user = await storage.authenticate(name, password);
    const items = await storage.loadMedications(user);
    await storage.saveSession(user);
    setMedications(items); setNotice(''); setUsername(user);
    try { await synchronize(user, items); }
    catch { setNotice('No pudimos activar los recordatorios. Revisá los permisos y volvé a intentar.'); }
  }

  async function logout() {
    if (username) await notifications.cancelUserReminders(username);
    await storage.clearSession();
    setUsername(null); setMedications([]); setRemindersEnabled(false); setNotice('');
  }

  async function add(draft: MedicationDraft) {
    if (!username) throw new Error('Iniciá sesión para continuar.');
    const error = validateMedication(draft);
    if (error) throw new Error(error);
    const medication: Medication = { ...draft, name: draft.name.trim(), note: draft.note.trim(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const items = [...medications, medication];
    await storage.saveMedications(username, items);
    setMedications(items);
    try {
      const granted = await notifications.enableNotifications();
      setRemindersEnabled(granted);
      if (granted) {
        await Promise.all(items.map((item) => notifications.scheduleMedication(username, item)));
        setNotice('Medicamento guardado. Te vamos a recordar todos los días a esa hora.');
      } else setNotice(notifications.notificationsAvailable
        ? 'Medicamento guardado. Activá las notificaciones para recibir el recordatorio.'
        : 'Medicamento guardado. Abrí la app en el celular para activar los recordatorios.');
    } catch { setNotice('Medicamento guardado, pero el recordatorio no se pudo programar. Tocá “Activar recordatorios” para reintentar.'); }
  }

  async function remove(id: string) {
    if (!username) return;
    await notifications.cancelMedication(username, id);
    const items = medications.filter((item) => item.id !== id);
    try { await storage.saveMedications(username, items); }
    catch (error) {
      try { await synchronize(username, medications); } catch { /* La pantalla informa el error de almacenamiento. */ }
      throw error;
    }
    setMedications(items); setNotice('Medicamento eliminado y recordatorio cancelado.');
  }

  async function enableReminders() {
    if (!username) return;
    const granted = await notifications.enableNotifications();
    setRemindersEnabled(granted);
    if (!granted) throw new Error(notifications.notificationsAvailable
      ? 'Permití las notificaciones desde los ajustes del celular y volvé a intentar.'
      : 'Los recordatorios locales se activan desde la app en Android o iOS.');
    await Promise.all(medications.map((item) => notifications.scheduleMedication(username, item)));
    setNotice('Listo. Tus recordatorios diarios están activados.');
  }

  return <AppContext.Provider value={{ username, medications, ready, startupError, notice, remindersEnabled,
    dismissNotice: () => setNotice(''), login, logout, add, remove, enableReminders,
    retry: () => { setReady(false); setAttempt((value) => value + 1); } }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('Falta AppProvider.');
  return value;
}
