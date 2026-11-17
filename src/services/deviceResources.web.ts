import { CalendarLink, Medication, MedicationContact, MedicationIntake } from '../types';

export const deviceResourcesAvailable = false;
export const calendarAvailable = false;

function unavailable(): never {
  throw new Error('Abrí Medicacion en el celular para usar los recursos del dispositivo.');
}

export function photoUri(_filename: string): string | undefined { return undefined; }
export function removePhoto(_filename?: string): void {}
export async function pickPhoto(_source: 'camera' | 'gallery'): Promise<string | null> { return unavailable(); }
export async function pickContact(): Promise<MedicationContact | null> { return unavailable(); }
export async function createCalendarLink(_medication: Medication, _intake: MedicationIntake): Promise<{ link: CalendarLink; undo: () => Promise<void> }> { return unavailable(); }
export async function openCalendarLink(_id: string): Promise<void> { return unavailable(); }
