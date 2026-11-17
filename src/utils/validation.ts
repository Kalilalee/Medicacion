import { MedicationDraft } from '../types';

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export function validateAccount(username: string, password: string): string | null {
  if (!/^[a-z0-9_.-]{3,24}$/.test(normalizeUsername(username))) {
    return 'Usá entre 3 y 24 letras, números, puntos o guiones para el usuario.';
  }
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  return null;
}

export function validateMedication(draft: MedicationDraft): string | null {
  if (draft.name.trim().length < 2) return 'Escribí el nombre del medicamento.';
  if (draft.name.trim().length > 60) return 'El nombre puede tener hasta 60 caracteres.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
    return 'Escribí una hora válida con formato HH:MM, por ejemplo 08:30.';
  }
  if (draft.note.trim().length > 140) return 'La nota puede tener hasta 140 caracteres.';
  return null;
}

export function nextReminder(time: string, now = new Date()): Date {
  const [hour, minute] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export function reminderDay(time: string, now = new Date()): string {
  return nextReminder(time, now).getDate() === now.getDate() ? 'Hoy' : 'Mañana';
}
