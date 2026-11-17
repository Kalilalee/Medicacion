import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Field, Intro, Notice, Page, PrimaryButton, ScreenHeader, TextAction, styles } from '../components/ui';
import { ArrowLeft, Clock3, Plus } from '../components/icons';
import { errorMessage, useApp } from '../context/AppContext';
import { colors, wideLayout } from '../theme';
import { validateMedication } from '../utils/validation';

const suggestedTimes = ['08:00', '14:00', '21:00'];

export default function AddScreen() {
  const { width } = useWindowDimensions();
  const split = width >= wideLayout;
  const { add } = useApp();
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function returnToRoutine() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function changeTime(value: string) {
    setTime(value);
    setError('');
  }

  async function submit() {
    const draft = { name, time, note };
    const invalid = validateMedication(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await add(draft);
      returnToRoutine();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const reminderInfo = (
    <View style={s.info}>
      <Clock3 size={19} color={colors.primary} strokeWidth={1.55} />
      <View style={s.infoCopy}>
        <Text style={styles.label}>Un aviso cada día</Text>
        <Text style={styles.hint}>El recordatorio se repite a la hora que elijas.</Text>
      </View>
    </View>
  );

  return (
    <Page wide={split}>
      <ScreenHeader action={<TextAction title="Mi rutina" icon={ArrowLeft} disabled={busy} onPress={returnToRoutine} />} />
      <View style={[s.layout, split && s.layoutWide]}>
        <View style={[s.heading, split && s.headingWide]}>
          <Intro eyebrow="MI RUTINA" title="Nuevo medicamento"
            description="Agregá el nombre y elegí el horario del recordatorio." />
          {split && reminderInfo}
        </View>
        <View style={[styles.card, s.form, split && s.formWide]}>
          <Field label="Nombre del medicamento" placeholder="Escribí el nombre" value={name}
            onChangeText={(value) => { setName(value); setError(''); }}
            maxLength={60} autoCapitalize="sentences" editable={!busy} />
          <View style={s.timeGroup}>
            <Field label="Hora del recordatorio" hint="Usá el formato de 24 horas, como 08:30."
              placeholder="08:00" value={time} onChangeText={changeTime} maxLength={5}
              keyboardType="numbers-and-punctuation" editable={!busy} style={s.timeInput} />
            <View style={s.chips}>
              {suggestedTimes.map((hour) => (
                <TouchableOpacity key={hour} accessibilityRole="button"
                  accessibilityState={{ selected: hour === time, disabled: busy }}
                  disabled={busy} onPress={() => changeTime(hour)}
                  style={[s.chip, hour === time && s.chipActive]}>
                  <Text style={[s.chipText, hour === time && s.chipTextActive]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Field label="Nota personal (opcional)" placeholder="Algo que quieras tener presente"
            hint="Escribí únicamente las indicaciones que ya tenés." value={note} onChangeText={setNote}
            maxLength={140} multiline editable={!busy} />
          {!split && reminderInfo}
          <Notice message={error} error />
          <PrimaryButton title="Guardar medicamento" icon={Plus} loading={busy} onPress={() => void submit()} />
        </View>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  layout: { gap: 22 },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 44, paddingTop: 12 },
  heading: { gap: 24 },
  headingWide: { flex: 0.85, minWidth: 0, paddingTop: 8 },
  form: { gap: 19 },
  formWide: { flex: 1.15, minWidth: 0, padding: 28 },
  timeGroup: { gap: 10 },
  timeInput: { fontSize: 23, color: colors.primary, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderRadius: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.soft, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '600', fontVariant: ['tabular-nums'] },
  chipTextActive: { color: colors.primary },
  info: { backgroundColor: colors.soft, borderRadius: 12, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center' },
  infoCopy: { flex: 1, gap: 3 },
});
