import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Button, Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Intro, Notice, Page, PrimaryButton, ScreenHeader, TextAction, styles } from '../components/ui';
import { Bell, Clock3, LogOut, Pill, Plus, Repeat2, Trash2 } from '../components/icons';
import { MedicationCard } from '../components/MedicationCard';
import { errorMessage, useApp } from '../context/AppContext';
import { colors, serif, wideLayout } from '../theme';
import { nextReminder, reminderDay } from '../utils/validation';
import { notificationsAvailable, testNotification } from '../services/notifications';
import { Medication } from '../types';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const split = width >= wideLayout;
  const { username, medications, logout, remove, notice, dismissNotice, remindersEnabled, enableReminders } = useApp();
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Medication | null>(null);
  const [now, setNow] = useState(new Date());
  const ordered = [...medications].sort((a, b) => nextReminder(a.time, now).getTime() - nextReminder(b.time, now).getTime());
  const next = ordered[0];
  const dayLabel = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await action();
      if (success) setFeedback(success);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    try {
      await remove(pendingDelete.id);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPendingDelete(null);
      setDeleting(false);
    }
  }

  function previewNotification() {
    if (username) {
      void run(() => testNotification(username), 'Aviso programado. Lo vas a recibir en 10 segundos.');
    }
  }

  const upcoming = (
    <View style={s.nextCard}>
      <View style={styles.row}>
        <Text style={s.nextEyebrow}>PRÓXIMO RECORDATORIO</Text>
        <View style={s.clockBadge}><Clock3 color={colors.onPrimary} size={20} strokeWidth={1.45} /></View>
      </View>
      {next ? (
        <>
          <View style={s.timeLine}>
            <Text style={s.nextTime}>{next.time}</Text>
            <Text style={s.nextDay}>{reminderDay(next.time, now)}</Text>
          </View>
          <Text style={s.nextName}>{next.name}</Text>
          {notificationsAvailable && (
            <Text style={s.nextNote}>{remindersEnabled ? 'Aviso diario activado' : 'Avisos del dispositivo desactivados'}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={s.nextName}>Sin avisos programados</Text>
          <Text style={s.nextNote}>Acá vas a ver el próximo horario de tu rutina.</Text>
        </>
      )}
    </View>
  );

  const notifications = (
    <View style={styles.card}>
      <View style={s.notificationsTitle}>
        <View style={s.iconBadge}><Bell color={colors.primary} size={19} strokeWidth={1.6} /></View>
        <Text accessibilityRole="header" style={s.cardTitle}>Notificaciones</Text>
      </View>
      <Text style={s.reminderText}>
        {!notificationsAvailable
          ? 'Abrí Medicacion en tu celular para recibir los avisos locales.'
          : remindersEnabled
            ? 'Los avisos están activos en este dispositivo.'
            : 'Activá los avisos para recibir un recordatorio a la hora que elijas.'}
      </Text>
      {notificationsAvailable && (
        <View style={s.notificationActions}>
          <PrimaryButton secondary icon={Repeat2} title={remindersEnabled ? 'Reprogramar recordatorios' : 'Activar recordatorios'}
            loading={busy} onPress={() => void run(enableReminders)} />
          <View style={s.nativeButton}>
            <Button title="Probar aviso en 10 segundos" color={colors.primary}
              disabled={busy} onPress={previewNotification} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Page wide={split}>
      <ScreenHeader action={<TextAction title="Salir" icon={LogOut} disabled={busy || deleting} onPress={() => void run(logout)} />} />
      <View style={[s.heading, split && s.headingWide]}>
        <View style={s.headingCopy}>
          <Intro eyebrow={dayLabel} title="Mi rutina" description={`Hola, ${username}. Consultá tus horarios y medicamentos.`} />
        </View>
        <PrimaryButton title="Agregar medicamento" icon={Plus} onPress={() => router.push('/add')} disabled={busy || deleting} />
      </View>
      {Boolean(notice || error || feedback) && (
        <View style={s.messages}>
          <Notice message={notice} onDismiss={dismissNotice} />
          <Notice message={error} error />
          <Notice message={feedback} />
        </View>
      )}
      <View style={[s.dashboard, split && s.dashboardWide]}>
        {!split && upcoming}
        <View style={[s.schedule, split && s.scheduleWide]}>
          <View style={styles.row}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Mis medicamentos</Text>
            <Text style={s.count}>{medications.length} {medications.length === 1 ? 'registro' : 'registros'}</Text>
          </View>
          {ordered.length > 0 ? (
            <View style={s.list}>
              {ordered.map((medication) => (
                <MedicationCard key={medication.id} medication={medication}
                  onDelete={() => setPendingDelete(medication)} deleting={deleting} />
              ))}
            </View>
          ) : (
            <View style={[styles.card, s.empty]}>
              <View style={s.emptyBadge}><Pill color={colors.primary} size={25} strokeWidth={1.45} /></View>
              <Text style={s.cardTitle}>Tu rutina empieza acá</Text>
              <Text style={s.emptyText}>Agregá un medicamento para organizar el primer recordatorio.</Text>
            </View>
          )}
        </View>
        <View style={[s.side, split && s.sideWide]}>
          {split && upcoming}
          {notifications}
        </View>
      </View>
      <Modal visible={!!pendingDelete} transparent animationType="fade"
        onRequestClose={() => { if (!deleting) setPendingDelete(null); }}>
        <ScrollView style={s.modalBackground} contentContainerStyle={s.overlay}>
          <View accessibilityViewIsModal style={[styles.card, s.dialog]}>
            <View style={s.iconBadge}><Trash2 color={colors.error} size={19} strokeWidth={1.65} /></View>
            <Text accessibilityRole="header" style={styles.sectionTitle}>¿Eliminar medicamento?</Text>
            <Text style={s.reminderText}>Se eliminará {pendingDelete?.name} y se cancelará su recordatorio diario.</Text>
            <PrimaryButton title="Sí, eliminar" icon={Trash2} danger loading={deleting} onPress={() => void confirmDelete()} />
            <PrimaryButton title="Conservar medicamento" secondary disabled={deleting} onPress={() => setPendingDelete(null)} />
          </View>
        </ScrollView>
      </Modal>
    </Page>
  );
}

const s = StyleSheet.create({
  heading: { gap: 16 },
  headingWide: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingTop: 8 },
  headingCopy: { flexShrink: 1, minWidth: 0 },
  messages: { gap: 9 },
  dashboard: { gap: 20 },
  dashboardWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  schedule: { gap: 12 },
  scheduleWide: { flex: 1.65, minWidth: 0 },
  side: { gap: 14 },
  sideWide: { flex: 1, minWidth: 0 },
  nextCard: { backgroundColor: colors.primaryDeep, padding: 19, borderRadius: 15, gap: 9 },
  nextEyebrow: { flexShrink: 1, color: colors.onPrimaryMuted, fontSize: 10, lineHeight: 16, letterSpacing: 1.6, fontWeight: '700' },
  clockBadge: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.onPrimaryLine, alignItems: 'center', justifyContent: 'center' },
  timeLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 11 },
  nextTime: { color: colors.onPrimary, fontFamily: serif, fontSize: 49, lineHeight: 53, letterSpacing: -1.6, fontVariant: ['tabular-nums'] },
  nextDay: { color: colors.onPrimaryMuted, fontSize: 13, lineHeight: 19 },
  nextName: { color: colors.onPrimary, fontSize: 17, lineHeight: 23, fontWeight: '600' },
  nextNote: { color: colors.onPrimaryMuted, fontSize: 12, lineHeight: 18 },
  count: { color: colors.primary, backgroundColor: colors.soft, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, fontSize: 11, lineHeight: 16 },
  list: { gap: 9 },
  empty: { alignItems: 'center', paddingVertical: 26, gap: 10 },
  emptyBadge: { width: 52, height: 52, borderRadius: 15, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '600', flexShrink: 1 },
  emptyText: { color: colors.muted, maxWidth: 300, textAlign: 'center', fontSize: 14, lineHeight: 21 },
  notificationsTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  reminderText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  notificationActions: { gap: 8 },
  nativeButton: { borderRadius: 9, overflow: 'hidden' },
  modalBackground: { flex: 1, backgroundColor: colors.overlay },
  overlay: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 400, gap: 14 },
});
