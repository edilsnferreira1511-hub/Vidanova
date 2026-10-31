import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useAuth } from './AuthContext';
import { Banner, Field, GlassButton, H1, Muted, Screen, logo } from './ui';
import { space } from './theme';

export default function Login() {
  const { signIn, configMissing } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = await signIn(id, pw);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <Screen bottomBar={false}>
      <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
        <Image source={logo} style={{ width: 120, height: 120, borderRadius: 28 }} />
        <H1>COOPMETRO BACKUP</H1>
        <Muted>Use o mesmo acesso do COOPMETRO XPT</Muted>
      </View>
      {configMissing.length > 0 && (
        <Banner kind="warning">Configuração pendente: {configMissing.join('; ')}.</Banner>
      )}
      <Field label="E-mail de acesso" value={id} onChangeText={setId} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Senha" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" autoComplete="password" />
      {error && <Banner kind="error">{error}</Banner>}
      <GlassButton label="Entrar" variant="primary" loading={busy} disabled={!id || !pw} onPress={submit} />
    </Screen>
  );
}
