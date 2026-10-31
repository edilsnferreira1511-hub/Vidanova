import React, { useState } from 'react';
import { useNav } from './navigation';
import { View } from 'react-native';
import { useProfile } from './AuthContext';
import { createRequest } from './backupService';
import { QrCapture } from './QrCapture';
import { Banner, Card, Field, FilterChip, GlassButton, GlassHeader, Label, Muted, Body, Screen, wrap } from './ui';
import type { RouteQr, VehicleQr } from './types';

const today = () => new Date().toISOString().slice(0, 10);

export default function NovaSolicitacao() {
  const p = useProfile();
  const nav = useNav();
  const [base, setBase] = useState(p.bases.length === 1 ? p.bases[0] : '');
  const [data, setData] = useState(today());
  const [route, setRoute] = useState<RouteQr | null>(null);
  const [vehicle, setVehicle] = useState<VehicleQr | null>(null);
  const [scan, setScan] = useState<'route' | 'vehicle' | null>(null);
  const [motorista, setMotorista] = useState('');
  const [pacotes, setPacotes] = useState('');
  const [paradas, setParadas] = useState('');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!base) return setError('Escolha a base solicitante.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setError('Data inválida. Use AAAA-MM-DD.');
    if (!route) return setError('Leia o QR Code da rota.');
    const np = Number(pacotes), nd = Number(paradas);
    if (!Number.isInteger(np) || np < 0 || !Number.isInteger(nd) || nd < 0) return setError('Pacotes e paradas devem ser números inteiros.');
    if (!motivo.trim()) return setError('Informe o motivo.');
    setBusy(true);
    try {
      const { kind: _k, ...veiculo } = vehicle ?? ({ kind: 'vehicle' } as VehicleQr);
      const id = await createRequest(p, {
        dataBackup: data, svc: route.svc, base, rotaId: route.rota, rotaNome: route.rota, containerId: route.containerId,
        veiculo: vehicle ? veiculo : undefined, motoristaNome: motorista.trim() || undefined,
        qtdPacotes: np, qtdParadas: nd, motivo: motivo.trim(),
      });
      nav.replace({ name: 'detalhes', id });
    } catch (e) {
      setError((e as Error).message || 'Não foi possível enviar a solicitação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <GlassHeader title="Nova solicitação" subtitle="Pagamento de backup" />
      <Card>
        <Label>Base solicitante</Label>
        {p.bases.length === 0 ? (
          <Banner kind="warning">Nenhuma base vinculada ao seu usuário.</Banner>
        ) : (
          <View style={wrap}>
            {p.bases.map((b) => <FilterChip key={b} label={b} active={base === b} onPress={() => setBase(b)} />)}
          </View>
        )}
        <Muted>Somente as bases vinculadas ao seu usuário.</Muted>
      </Card>
      <Field label="Data do backup (AAAA-MM-DD)" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation" />

      <Card>
        <Label>Rota</Label>
        {route ? (<><Body>SVC {route.svc} · Rota {route.rota}</Body><Muted>Contêiner {route.containerId}</Muted></>) : <Muted>Nenhuma rota lida.</Muted>}
        <GlassButton label={route ? 'Ler outro QR da rota' : 'Ler QR Code da rota'} onPress={() => setScan('route')} />
      </Card>
      <Card>
        <Label>Veículo / motorista</Label>
        {vehicle ? (<><Body>Placa {vehicle.placa} · {vehicle.tipoVeiculo ?? 'tipo n/d'}</Body><Muted>{vehicle.carrierName} · ID no QR {vehicle.qrId}</Muted></>) : <Muted>Opcional: leia o QR do veículo.</Muted>}
        <GlassButton label={vehicle ? 'Ler outro QR do veículo' : 'Ler QR Code do veículo'} onPress={() => setScan('vehicle')} />
        <Field label="Nome do motorista" value={motorista} onChangeText={setMotorista} />
      </Card>

      <Field label="Quantidade de pacotes" value={pacotes} onChangeText={setPacotes} keyboardType="number-pad" />
      <Field label="Quantidade de paradas" value={paradas} onChangeText={setParadas} keyboardType="number-pad" />
      <Field label="Motivo da solicitação" value={motivo} onChangeText={setMotivo} multiline />

      {error && <Banner kind="error">{error}</Banner>}
      <GlassButton label="Enviar solicitação" variant="primary" loading={busy} onPress={submit} />

      <QrCapture expected="route" visible={scan === 'route'} onClose={() => setScan(null)} onConfirm={setRoute} />
      <QrCapture expected="vehicle" visible={scan === 'vehicle'} onClose={() => setScan(null)} onConfirm={setVehicle} />
    </Screen>
  );
}
