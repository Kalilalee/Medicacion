import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../context/AppContext';
import { Page, PrimaryButton, styles } from '../components/ui';
import { colors } from '../theme';

function Navigator() {
  const { ready, username, startupError, retry } = useApp();
  if (!ready) return <Page><ActivityIndicator accessibilityLabel="Cargando tus datos" color={colors.primary} /></Page>;
  if (startupError) return <Page><Text style={styles.title}>No pudimos abrir tus datos</Text>
    <Text style={styles.subtitle}>{startupError}</Text><PrimaryButton title="Volver a intentar" onPress={retry} /></Page>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!!username}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
    </Stack.Protected>
    <Stack.Protected guard={!username}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><StatusBar style="dark" /><Navigator /></AppProvider></SafeAreaProvider>;
}
