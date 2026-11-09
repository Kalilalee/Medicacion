export type User = { username: string; password: string };
export type Medication = { id: string; name: string; time: string; note: string };
export type MedicationDraft = Omit<Medication, 'id'>;
