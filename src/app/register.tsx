import { router } from 'expo-router';
import { useState } from 'react';
import { AuthLayout, Field, Notice, PrimaryButton, TextAction } from '../components/ui';
import { ArrowLeft, UserRound } from '../components/icons';
import { errorMessage } from '../context/AppContext';
import { register } from '../services/storage';
import { validateAccount } from '../utils/validation';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const invalid = validateAccount(username, password);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register(username, password);
      router.replace({ pathname: '/login', params: { registered: '1' } });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Creá tu cuenta"
      description="Guardá tu rutina de medicación en este dispositivo."
      back={<TextAction title="Volver al inicio de sesión" icon={ArrowLeft} disabled={busy}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/login');
        }} />}>
      <Field label="Usuario" hint="Entre 3 y 24 letras, números, puntos o guiones."
        value={username} onChangeText={setUsername} placeholder="Elegí un usuario"
        autoCapitalize="none" autoCorrect={false} autoComplete="username-new" maxLength={24} editable={!busy} />
      <Field label="Contraseña" hint="Al menos 6 caracteres." value={password} onChangeText={setPassword}
        placeholder="Creá una contraseña" secureTextEntry autoCapitalize="none" autoCorrect={false}
        autoComplete="new-password" editable={!busy} />
      <Field label="Repetir contraseña" value={confirmation} onChangeText={setConfirmation}
        placeholder="Escribila una vez más" secureTextEntry autoCapitalize="none" autoCorrect={false}
        autoComplete="new-password" editable={!busy} onSubmitEditing={() => void submit()} />
      <Notice message={error} error />
      <PrimaryButton title="Crear cuenta" icon={UserRound} loading={busy} onPress={() => void submit()} />
    </AuthLayout>
  );
}
