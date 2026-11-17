import { create } from 'zustand';
import { Medication, MedicationDetails, MedicationDraft } from '../types';
import * as storage from '../services/storage';
import * as notifications from '../services/notifications';
import { createCalendarLink, removePhoto } from '../services/deviceResources';
import { errorMessage } from '../utils/errors';
import { validateMedication } from '../utils/validation';

type MedicationStore = {
  username: string | null;
  medications: Medication[];
  ready: boolean;
  startupError: string;
  notice: string;
  remindersEnabled: boolean;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  add: (draft: MedicationDraft) => Promise<void>;
  update: (id: string, changes: Partial<MedicationDraft & MedicationDetails>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  recordIntake: (id: string) => Promise<void>;
  removeIntake: (id: string, intakeId: string) => Promise<void>;
  addToCalendar: (id: string, intakeId: string) => Promise<void>;
  enableReminders: () => Promise<void>;
  dismissNotice: () => void;
};

let pendingWrite = Promise.resolve();

function serialize(action: () => Promise<void>) {
  const result = pendingWrite.then(action);
  pendingWrite = result.catch(() => {});
  return result;
}

function normalizeMedication<T extends MedicationDraft>(draft: T): T {
  const error = validateMedication(draft);
  if (error) throw new Error(error);
  return { ...draft, name: draft.name.trim(), note: draft.note.trim() };
}

export const useMedicationStore = create<MedicationStore>()((set, get) => {
  function signedInUser() {
    const { username } = get();
    if (!username) throw new Error('Iniciá sesión para continuar.');
    return username;
  }

  function findMedication(id: string) {
    const medication = get().medications.find((item) => item.id === id);
    if (!medication) throw new Error('Este medicamento ya no está en tu rutina.');
    return medication;
  }

  async function save(username: string, medications: Medication[]) {
    await storage.saveMedications(username, medications);
    set({ medications });
  }

  async function replace(username: string, medication: Medication) {
    await save(username, get().medications.map((item) => item.id === medication.id ? medication : item));
  }

  async function synchronize(username: string, medications: Medication[]) {
    const granted = await notifications.notificationsGranted();
    set({ remindersEnabled: granted });
    if (granted) await Promise.all(medications.map((item) => notifications.scheduleMedication(username, item)));
  }

  async function restoreReminders(username: string, medications: Medication[]) {
    try {
      await synchronize(username, medications);
    } catch {
      set({ notice: 'Tus datos están guardados. Revisá los permisos para volver a activar los recordatorios.' });
    }
  }

  return {
    username: null,
    medications: [],
    ready: false,
    startupError: '',
    notice: '',
    remindersEnabled: false,
    dismissNotice: () => set({ notice: '' }),
    initialize: () => serialize(async () => {
      if (get().ready && !get().startupError) return;
      set({ ready: false, startupError: '' });
      try {
        const username = await storage.restoreSession();
        const medications = username ? await storage.loadMedications(username) : [];
        set({ username, medications });
        if (username) await restoreReminders(username, medications);
      } catch (error) {
        set({ startupError: errorMessage(error) });
      } finally {
        set({ ready: true });
      }
    }),
    login: (name, password) => serialize(async () => {
      const username = await storage.authenticate(name, password);
      const medications = await storage.loadMedications(username);
      await storage.saveSession(username);
      set({ username, medications, notice: '' });
      await restoreReminders(username, medications);
    }),
    logout: () => serialize(async () => {
      const { username, medications } = get();
      if (username) await notifications.cancelUserReminders(username);
      try {
        await storage.clearSession();
      } catch (error) {
        if (username) await restoreReminders(username, medications);
        throw error;
      }
      set({ username: null, medications: [], remindersEnabled: false, notice: '' });
    }),
    add: (draft) => serialize(async () => {
      const username = signedInUser();
      const medication: Medication = {
        ...normalizeMedication(draft),
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      const medications = [...get().medications, medication];
      await save(username, medications);
      try {
        const granted = await notifications.enableNotifications();
        set({ remindersEnabled: granted });
        if (granted) {
          await Promise.all(medications.map((item) => notifications.scheduleMedication(username, item)));
          set({ notice: 'Medicamento guardado. Te vamos a recordar todos los días a esa hora.' });
        } else {
          set({ notice: notifications.notificationsAvailable
            ? 'Medicamento guardado. Activá las notificaciones para recibir el recordatorio.'
            : 'Medicamento guardado. Abrí la app en el celular para activar los recordatorios.' });
        }
      } catch {
        set({ notice: 'Medicamento guardado. Volvé a activar los recordatorios para reintentar la programación.' });
      }
    }),
    update: (id, changes) => serialize(async () => {
      const username = signedInUser();
      const previous = findMedication(id);
      const medication = normalizeMedication({ ...previous, ...changes });
      await replace(username, medication);
      if (medication.photo !== previous.photo) removePhoto(previous.photo);
      if (medication.time !== previous.time || medication.name !== previous.name) {
        try {
          const granted = await notifications.notificationsGranted();
          set({ remindersEnabled: granted });
          if (granted) await notifications.scheduleMedication(username, medication);
        } catch {
          set({ notice: 'Cambios guardados. Reprogramá los recordatorios desde Mi rutina.' });
          return;
        }
      }
      set({ notice: 'Cambios guardados.' });
    }),
    remove: (id) => serialize(async () => {
      const username = signedInUser();
      const medication = findMedication(id);
      const { medications } = get();
      await notifications.cancelMedication(username, id);
      try {
        await save(username, medications.filter((item) => item.id !== id));
      } catch (error) {
        await restoreReminders(username, medications);
        throw error;
      }
      removePhoto(medication.photo);
      set({ notice: 'Medicamento eliminado y recordatorio diario cancelado.' });
    }),
    recordIntake: (id) => serialize(async () => {
      const username = signedInUser();
      const medication = findMedication(id);
      const intake = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        takenAt: new Date().toISOString(),
      };
      await replace(username, { ...medication, intakes: [...(medication.intakes ?? []), intake] });
    }),
    removeIntake: (id, intakeId) => serialize(async () => {
      const username = signedInUser();
      const medication = findMedication(id);
      await replace(username, {
        ...medication,
        intakes: (medication.intakes ?? []).filter((intake) => intake.id !== intakeId),
      });
    }),
    addToCalendar: (id, intakeId) => serialize(async () => {
      const username = signedInUser();
      const medication = findMedication(id);
      const intake = medication.intakes?.find((item) => item.id === intakeId);
      if (!intake) throw new Error('Registrá una toma antes de guardarla en el calendario.');
      if (intake.calendarEvent) return;
      const event = await createCalendarLink(medication, intake);
      try {
        await replace(username, {
          ...medication,
          intakes: medication.intakes?.map((item) => item.id === intakeId ? { ...item, calendarEvent: event.link } : item),
        });
      } catch (error) {
        await event.undo().catch(() => {});
        throw error;
      }
    }),
    enableReminders: () => serialize(async () => {
      const username = signedInUser();
      const granted = await notifications.enableNotifications();
      set({ remindersEnabled: granted });
      if (!granted) throw new Error(notifications.notificationsAvailable
        ? 'Permití las notificaciones desde los ajustes del celular y volvé a intentar.'
        : 'Los recordatorios locales se activan desde la app en Android o iOS.');
      await Promise.all(get().medications.map((item) => notifications.scheduleMedication(username, item)));
      set({ notice: 'Tus recordatorios están activos.' });
    }),
  };
});
