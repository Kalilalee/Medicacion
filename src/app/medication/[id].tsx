import { router, useLocalSearchParams } from 'expo-router';
import { ComponentType, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Camera, Clock3, ContactRound, ImageIcon, Pencil, Trash2 } from '../../components/icons';
import { IntakeCalendar } from '../../components/IntakeCalendar';
import { Intro, Notice, Page, PrimaryButton, ScreenHeader, TextAction, styles } from '../../components/ui';
import {
  calendarAvailable, deviceResourcesAvailable, openCalendarLink,
  photoUri, pickContact, pickPhoto, removePhoto,
} from '../../services/deviceResources';
import { useMedicationStore } from '../../stores/medicationStore';
import { colors, wideLayout } from '../../theme';
import { DevicePermissionError, errorMessage } from '../../utils/errors';

type ResourceAction = 'camera' | 'gallery' | 'contacts' | 'record' | 'calendar' | 'openEvent' | 'remove';

function ResourceCard({ title, icon: Icon, children }: PropsWithChildren<{
  title: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}>) {
  return <View style={styles.card}>
    <View style={s.resourceTitle}>
      <View style={s.badge}><Icon size={18} color={colors.primary} strokeWidth={1.6} /></View>
      <Text accessibilityRole="header" style={s.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>;
}

export default function MedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const split = width >= wideLayout;
  const medication = useMedicationStore((state) => state.medications.find((item) => item.id === id));
  const update = useMedicationStore((state) => state.update);
  const recordIntake = useMedicationStore((state) => state.recordIntake);
  const removeIntake = useMedicationStore((state) => state.removeIntake);
  const addToCalendar = useMedicationStore((state) => state.addToCalendar);
  const [busy, setBusy] = useState<ResourceAction | null>(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const running = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function run(action: ResourceAction, execute: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(action);
    setError('');
    setFeedback('');
    setSettings(false);
    try {
      await execute();
    } catch (failure) {
      setError(errorMessage(failure));
      setSettings(failure instanceof DevicePermissionError && !failure.canAskAgain);
    } finally {
      running.current = false;
      setBusy(null);
    }
  }

  async function attachPhoto(source: 'camera' | 'gallery') {
    const photo = await pickPhoto(source);
    if (!photo) return;
    try {
      await update(id, { photo });
      setFeedback('Foto guardada.');
    } catch (failure) {
      removePhoto(photo);
      throw failure;
    }
  }

  if (!medication) {
    return <Page>
      <ScreenHeader action={<TextAction title="Mi rutina" icon={ArrowLeft} onPress={goBack} />} />
      <Intro title="Medicamento no disponible" description="Volvé a tu rutina para ver los medicamentos guardados." />
    </Page>;
  }

  const photo = medication.photo ? photoUri(medication.photo) : undefined;
  const disabled = busy !== null;

  const photoCard = <ResourceCard title="Foto del medicamento" icon={ImageIcon}>
    {photo ? <Image source={{ uri: photo }} style={s.photo} accessibilityLabel={`Foto de ${medication.name}`} /> : (
      <View style={s.photoEmpty}>
        <ImageIcon color={colors.muted} size={24} strokeWidth={1.45} />
        <Text style={styles.hint}>Agregá una foto para reconocer el medicamento.</Text>
      </View>
    )}
    <View style={s.photoActions}>
      <View style={s.photoAction}>
        <PrimaryButton title="Tomar foto" secondary icon={Camera} disabled={disabled} loading={busy === 'camera'}
          onPress={() => void run('camera', () => attachPhoto('camera'))} />
      </View>
      <View style={s.photoAction}>
        <PrimaryButton title="Elegir de galería" secondary icon={ImageIcon} disabled={disabled} loading={busy === 'gallery'}
          onPress={() => void run('gallery', () => attachPhoto('gallery'))} />
      </View>
    </View>
    {photo && <TextAction title="Quitar foto" icon={Trash2} disabled={disabled}
      onPress={() => void run('remove', async () => {
        await update(id, { photo: undefined });
        setFeedback('Foto quitada.');
      })} />}
  </ResourceCard>;

  return <Page wide={split}>
    <ScreenHeader action={<TextAction title="Mi rutina" icon={ArrowLeft} disabled={disabled} onPress={goBack} />} />
    <View style={[s.heading, split && s.headingWide]}>
      <View style={s.headingCopy}>
        <Intro eyebrow="FICHA DEL MEDICAMENTO" title={medication.name} description={medication.note || undefined} />
        <View style={s.schedule}>
          <Clock3 size={16} color={colors.primary} strokeWidth={1.6} />
          <Text style={styles.label}>Todos los días a las {medication.time}</Text>
        </View>
      </View>
      <PrimaryButton title="Editar datos" icon={Pencil} secondary disabled={disabled}
        onPress={() => router.push({ pathname: '/add', params: { id } })} />
    </View>

    {Boolean(busy || error || feedback) && <View style={s.messages}>
      {busy && <Text accessibilityLiveRegion="polite" style={styles.hint}>Guardando los cambios…</Text>}
      <Notice message={error} error />
      <Notice message={feedback} />
      {settings && <TextAction title="Abrir ajustes" onPress={() => {
        void Linking.openSettings().catch((failure: unknown) => setError(errorMessage(failure)));
      }} />}
    </View>}

    <View style={[s.resources, split && s.resourcesWide]}>
      <View style={[s.column, split && s.columnWide]}>
        <IntakeCalendar key={medication.id} intakes={medication.intakes} now={now}
          disabled={disabled} recording={busy === 'record'} calendarAvailable={calendarAvailable}
          onRecord={() => void run('record', async () => {
            await recordIntake(id);
            setNow(Date.now());
            setFeedback('Toma registrada con la fecha y hora actuales.');
          })}
          onRemove={(intakeId) => void run('remove', async () => {
            await removeIntake(id, intakeId);
            setFeedback('Registro de toma eliminado.');
          })}
          onExport={(intakeId) => void run('calendar', async () => {
            await addToCalendar(id, intakeId);
            setFeedback('Toma guardada en el calendario del celular.');
          })}
          onOpen={(eventId) => void run('openEvent', () => openCalendarLink(eventId))} />
      </View>
      <View style={[s.column, split && s.columnWide]}>
        {deviceResourcesAvailable ? <>
        {photoCard}
        <ResourceCard title="Contacto relacionado" icon={ContactRound}>
          <Text style={s.description}>{medication.contact?.name ?? 'Asociá a un médico o familiar de tu agenda.'}</Text>
          <PrimaryButton title={medication.contact ? 'Cambiar contacto' : 'Elegir contacto'}
            secondary disabled={disabled} loading={busy === 'contacts'} onPress={() => void run('contacts', async () => {
              const contact = await pickContact();
              if (!contact) return;
              await update(id, { contact });
              setFeedback('Contacto guardado.');
            })} />
          {medication.contact && <TextAction title="Quitar contacto" disabled={disabled}
            onPress={() => void run('remove', async () => {
              await update(id, { contact: undefined });
              setFeedback('Contacto quitado.');
            })} />}
        </ResourceCard>
        </> : <View style={styles.card}>
          <Text style={s.cardTitle}>Foto y contacto</Text>
          <Text style={s.description}>Abrí esta ficha en la app móvil para asociar una foto o un contacto al medicamento.</Text>
        </View>}
      </View>
    </View>
  </Page>;
}

const s = StyleSheet.create({
  heading: { gap: 14 },
  headingWide: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headingCopy: { flexShrink: 1, minWidth: 0, gap: 8 },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messages: { gap: 8 },
  resources: { gap: 14 },
  resourcesWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  column: { minWidth: 0, gap: 14 },
  columnWide: { flex: 1 },
  resourceTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 35, height: 35, borderRadius: 9, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flexShrink: 1, color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  photo: { width: '100%', height: 196, borderRadius: 11, resizeMode: 'contain', backgroundColor: colors.soft },
  photoEmpty: { minHeight: 76, gap: 8, borderRadius: 11, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', padding: 12 },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoAction: { flexGrow: 1, flexBasis: 126 },
});
