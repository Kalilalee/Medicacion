import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicationIntake } from '../types';
import { colors, serif } from '../theme';
import { localDateKey, monthWeeks } from '../utils/intakes';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Trash2 } from './icons';
import { PrimaryButton, TextAction, styles } from './ui';

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const dateLabel = (date: Date) => date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const timeLabel = (value: string) => new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

export function IntakeCalendar({
  intakes = [], now, disabled = false, recording = false, calendarAvailable = false,
  onRecord, onRemove, onExport, onOpen,
}: {
  intakes?: MedicationIntake[];
  now: number;
  disabled?: boolean;
  recording?: boolean;
  calendarAvailable?: boolean;
  onRecord: () => void;
  onRemove: (intakeId: string) => void;
  onExport: (intakeId: string) => void;
  onOpen: (eventId: string) => void;
}) {
  const [month, setMonth] = useState(() => new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1));
  const [selected, setSelected] = useState(() => new Date(now));
  const [pendingDelete, setPendingDelete] = useState<MedicationIntake | null>(null);
  const selectedKey = localDateKey(selected);
  const todayKey = localDateKey(new Date(now));
  const counts = new Map<string, number>();
  for (const intake of intakes) {
    const key = localDateKey(new Date(intake.takenAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const selectedIntakes = intakes
    .filter((intake) => localDateKey(new Date(intake.takenAt)) === selectedKey)
    .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt));

  function showDate(date: Date) {
    setSelected(date);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  return <View style={[styles.card, s.card]}>
    <View style={s.titleRow}>
      <View style={s.badge}><CalendarDays size={18} color={colors.primary} strokeWidth={1.6} /></View>
      <Text accessibilityRole="header" style={s.title}>Calendario de tomas</Text>
    </View>
    <Text style={s.description}>Marcá cada toma para guardar el día y la hora en que la realizaste.</Text>
    <PrimaryButton title="Tomé el medicamento" icon={Check} disabled={disabled} loading={recording}
      onPress={() => { showDate(new Date()); onRecord(); }} />

    <View style={s.calendar}>
      <View style={s.monthRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mes anterior" disabled={disabled}
          accessibilityState={{ disabled }} style={s.monthButton}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft size={19} color={colors.primary} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={s.month}>
          {month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mes siguiente" disabled={disabled}
          accessibilityState={{ disabled }} style={s.monthButton}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight size={19} color={colors.primary} strokeWidth={1.7} />
        </TouchableOpacity>
      </View>
      <View style={s.week}>
        {weekdays.map((weekday) => <Text key={weekday} style={s.weekday}>{weekday}</Text>)}
      </View>
      {monthWeeks(month).map((week, index) => <View key={index} style={s.week}>
        {week.map((date, weekday) => {
          if (!date) return <View key={weekday} style={s.daySlot} />;
          const key = localDateKey(date);
          const active = key === selectedKey;
          const count = counts.get(key) ?? 0;
          return <View key={weekday} style={s.daySlot}>
            <TouchableOpacity accessibilityRole="button" disabled={disabled}
              accessibilityLabel={`${dateLabel(date)}, ${count} ${count === 1 ? 'toma registrada' : 'tomas registradas'}`}
              accessibilityState={{ selected: active, disabled }}
              onPress={() => setSelected(date)}
              style={[s.day, key === todayKey && s.today, active && s.selectedDay]}>
              <Text style={[s.dayNumber, active && s.selectedText]}>{date.getDate()}</Text>
              <View style={[s.dot, count > 0 && s.recordedDot, count > 0 && active && s.selectedDot]} />
            </TouchableOpacity>
          </View>;
        })}
      </View>)}
      <View style={s.calendarFooter}>
        <View style={s.legend}>
          <View style={[s.dot, s.recordedDot]} />
          <Text style={styles.hint}>Días con tomas registradas</Text>
        </View>
        <TextAction title="Hoy" disabled={disabled} onPress={() => showDate(new Date(now))} />
      </View>
    </View>

    <View style={s.history}>
      <Text accessibilityRole="header" style={s.historyTitle}>{dateLabel(selected)}</Text>
      {selectedIntakes.length === 0 ? <Text style={s.description}>No hay tomas registradas este día.</Text> : (
        selectedIntakes.map((intake) => <View key={intake.id} style={s.intake}>
          <View style={s.intakeRow}>
            <Clock3 size={17} color={colors.primary} strokeWidth={1.6} />
            <View style={s.intakeCopy}>
              <Text style={s.time}>{timeLabel(intake.takenAt)}</Text>
              <Text style={styles.hint}>Toma registrada</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" disabled={disabled}
              accessibilityLabel={`Eliminar toma de las ${timeLabel(intake.takenAt)}`}
              accessibilityState={{ disabled }} style={s.deleteButton}
              onPress={() => setPendingDelete(intake)}>
              <Trash2 size={16} color={colors.muted} strokeWidth={1.7} />
            </TouchableOpacity>
          </View>
          {calendarAvailable && (intake.calendarEvent ? (
            <TextAction title="Ver en Calendario" icon={CalendarDays} disabled={disabled}
              onPress={() => onOpen(intake.calendarEvent!.id)} />
          ) : (
            <TextAction title="Guardar en Calendario" icon={CalendarDays} disabled={disabled}
              onPress={() => onExport(intake.id)} />
          ))}
        </View>)
      )}
    </View>

    <Modal visible={!!pendingDelete} transparent animationType="fade"
      onRequestClose={() => setPendingDelete(null)}>
      <ScrollView style={s.modalBackground} contentContainerStyle={s.overlay}>
        <View accessibilityViewIsModal style={[styles.card, s.dialog]}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>¿Eliminar esta toma?</Text>
          <Text style={s.description}>
            Se quitará del historial la toma de las {pendingDelete ? timeLabel(pendingDelete.takenAt) : ''}.
          </Text>
          {pendingDelete?.calendarEvent && <Text style={styles.hint}>
            El evento guardado en el calendario del celular se administra desde Calendario.
          </Text>}
          <PrimaryButton title="Eliminar registro" danger icon={Trash2} disabled={disabled}
            onPress={() => {
              if (pendingDelete) onRemove(pendingDelete.id);
              setPendingDelete(null);
            }} />
          <PrimaryButton title="Conservar toma" secondary onPress={() => setPendingDelete(null)} />
        </View>
      </ScrollView>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  card: { padding: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 35, height: 35, borderRadius: 9, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  title: { flexShrink: 1, color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  calendar: { gap: 3 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  monthButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  month: { flex: 1, color: colors.ink, fontFamily: serif, fontSize: 22, lineHeight: 28, textAlign: 'center', textTransform: 'capitalize' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 10, lineHeight: 20, fontWeight: '600' },
  daySlot: { flex: 1, minWidth: 0, padding: 1 },
  day: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 2 },
  today: { borderColor: colors.fieldBorder },
  selectedDay: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayNumber: { color: colors.ink, fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'] },
  selectedText: { color: colors.onPrimary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  recordedDot: { backgroundColor: colors.primary },
  selectedDot: { backgroundColor: colors.onPrimary },
  calendarFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  history: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 10 },
  historyTitle: { color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  intake: { borderWidth: 1, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  intakeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intakeCopy: { flex: 1, gap: 1 },
  time: { color: colors.primary, fontSize: 16, lineHeight: 23, fontWeight: '600', fontVariant: ['tabular-nums'] },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  modalBackground: { flex: 1, backgroundColor: colors.overlay },
  overlay: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 400 },
});
