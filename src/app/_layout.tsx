import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Page, PrimaryButton, styles } from '../components/ui';
import { useMedicationStore } from '../stores/medicationStore';
import { colors } from '../theme';

function Navigator() {
  const ready = useMedicationStore((state) => state.ready);
  const username = useMedicationStore((state) => state.username);
  const startupError = useMedicationStore((state) => state.startupError);
  const initialize = useMedicationStore((state) => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);

  if (!ready) return <Page><ActivityIndicator accessibilityLabel="Cargando tus datos" color={colors.primary} /></Page>;
  if (startupError) return <Page><Text style={styles.title}>No pudimos abrir tus datos</Text>
    <Text style={styles.subtitle}>{startupError}</Text>
    <PrimaryButton title="Volver a intentar" onPress={() => void initialize()} /></Page>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!!username}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="medication/[id]" />
    </Stack.Protected>
    <Stack.Protected guard={!username}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <SafeAreaProvider><StatusBar style="dark" /><Navigator /></SafeAreaProvider>;
}
