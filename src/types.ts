export type User = { username: string; password: string };
export type MedicationDraft = { name: string; time: string; note: string };
export type MedicationContact = { id: string; name: string };
export type CalendarLink = { id: string; startsAt: string };
export type MedicationIntake = { id: string; takenAt: string; calendarEvent?: CalendarLink };
export type MedicationDetails = {
  photo?: string;
  contact?: MedicationContact;
};
export type Medication = MedicationDraft & MedicationDetails & {
  id: string;
  intakes?: MedicationIntake[];
};
