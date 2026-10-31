import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { parseQr } from './qr';
import type { QrParseResult, RouteQr, VehicleQr } from './types';
import { Banner, Body, Card, Field, GlassButton, H2, Muted, Screen } from './ui';
import { space } from './theme';

type Expected = 'route' | 'vehicle';
type Data<E extends Expected> = E extends 'route' ? RouteQr : VehicleQr;

/**
 * Lê (câmera ou texto colado) e VALIDA o QR antes de qualquer preenchimento.
 * Só chama onConfirm depois que a pessoa vê os dados e confirma.
 */
export function QrCapture<E extends Expected>({
  expected, visible, onClose, onConfirm,
}: { expected: E; visible: boolean; onClose: () => void; onConfirm: (d: Data<E>) => void }) {
  const [perm, requestPerm] = useCameraPermissions();
  const [result, setResult] = useState<QrParseResult | null>(null);
  const [pasted, setPasted] = useState('');
  const title = expected === 'route' ? 'QR Code da rota' : 'QR Code do veículo';

  const evaluate = (raw: string) => {
    const r = parseQr(raw);
    if (r.ok && r.data.kind !== expected) {
      setResult({ ok: false, errors: [`Este é um QR de ${r.data.kind === 'route' ? 'rota' : 'veículo'}, mas o esperado é ${expected === 'route' ? 'rota' : 'veículo'}.`], raw });
    } else setResult(r);
  };
  const reset = () => { setResult(null); setPasted(''); };
  const close = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <Screen bottomBar={false}>
        <H2>{title}</H2>
        {!result && (
          <>
            {perm?.granted ? (
              <View style={{ height: 320, borderRadius: 22, overflow: 'hidden' }}>
                <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => evaluate(data)} />
              </View>
            ) : (
              <Card>
                <Body>Para ler o QR Code é preciso permitir o uso da câmera.</Body>
                <GlassButton label="Permitir câmera" variant="primary" onPress={requestPerm} />
              </Card>
            )}
            <Muted>Ou cole o conteúdo do QR para validar:</Muted>
            <Field label="Conteúdo do QR" value={pasted} onChangeText={setPasted} multiline autoCapitalize="none" autoCorrect={false} />
            <GlassButton label="Validar conteúdo colado" disabled={!pasted.trim()} onPress={() => evaluate(pasted)} />
          </>
        )}

        {result && !result.ok && (
          <>
            {result.errors.map((e) => <Banner key={e} kind="error">{e}</Banner>)}
            <GlassButton label="Tentar novamente" onPress={reset} />
          </>
        )}

        {result?.ok && (
          <>
            <Banner kind="success">QR válido. Confira os dados antes de usar.</Banner>
            <Card>
              {Object.entries(result.data).filter(([k]) => k !== 'kind').map(([k, v]) => (
                <View key={k}><Muted>{k}</Muted><Body>{Array.isArray(v) ? v.join(', ') || '—' : String(v ?? '—')}</Body></View>
              ))}
            </Card>
            {result.warnings.map((w) => <Banner key={w} kind="warning">{w}</Banner>)}
            <GlassButton label="Usar estes dados" variant="primary"
              onPress={() => { onConfirm(result.data as Data<E>); close(); }} />
            <GlassButton label="Ler outro" onPress={reset} />
          </>
        )}
        <View style={{ height: space.sm }} />
        <GlassButton label="Fechar" onPress={close} />
      </Screen>
    </Modal>
  );
}
