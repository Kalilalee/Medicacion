import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Medication } from '../types';
import { colors } from '../theme';
import { Trash2 } from './icons';

export function MedicationCard({ medication, onDelete, deleting = false }: {
  medication: Medication; onDelete: () => void; deleting?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.timeBlock}>
        <Text style={styles.time}>{medication.time}</Text>
        <Text style={styles.daily}>DIARIO</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.note}>{medication.note || 'Recordatorio diario'}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Eliminar ${medication.name}`}
        accessibilityState={{ disabled: deleting }} disabled={deleting}
        onPress={onDelete} style={[styles.delete, deleting && styles.disabled]}>
        <Trash2 size={17} color={colors.muted} strokeWidth={1.65} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  timeBlock: { minWidth: 60, borderRightWidth: 1, borderRightColor: colors.line, paddingRight: 10, paddingVertical: 3 },
  time: { color: colors.primary, fontSize: 18, lineHeight: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
  daily: { color: colors.muted, fontSize: 9, lineHeight: 15, letterSpacing: 1.2, fontWeight: '600' },
  details: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.background },
  disabled: { opacity: 0.58 },
});
