import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLayout, Field, Notice, PrimaryButton, TextAction, styles } from '../components/ui';
import { ArrowRight, LockKeyhole } from '../components/icons';
import { errorMessage, useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function LoginScreen() {
  const { login } = useApp();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username.trim() || !password) {
      setError('Completá el usuario y la contraseña.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(username, password);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Iniciá sesión" description="Ingresá para consultar y organizar tus recordatorios.">
      {registered && <Notice message="Tu cuenta está lista. Iniciá sesión para empezar." />}
      <Field label="Usuario" value={username} onChangeText={setUsername}
        placeholder="Tu nombre de usuario" autoCapitalize="none" autoCorrect={false}
        autoComplete="username" maxLength={24} editable={!busy} />
      <Field label="Contraseña" value={password} onChangeText={setPassword}
        placeholder="Tu contraseña" secureTextEntry autoCapitalize="none" autoCorrect={false}
        autoComplete="current-password" onSubmitEditing={() => void submit()} editable={!busy} />
      <Notice message={error} error />
      <PrimaryButton title="Iniciar sesión" icon={ArrowRight} onPress={() => void submit()} loading={busy} />
      <View style={localStyles.footer}>
        <TextAction title="Creá tu cuenta" disabled={busy} onPress={() => router.push('/register')} />
        <View style={localStyles.privacy}>
          <LockKeyhole size={14} color={colors.muted} strokeWidth={1.7} />
          <Text style={styles.hint}>Tus datos se guardan en este dispositivo.</Text>
        </View>
      </View>
    </AuthLayout>
  );
}

const localStyles = StyleSheet.create({
  footer: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 4, gap: 4 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
