import React, { useState } from 'react';
import { useNav } from './navigation';
import { View } from 'react-native';
import { useProfile } from './AuthContext';
import { useFilters } from './FiltersContext';
import { STATUS_LABEL } from './status';
import type { RequestStatus } from './types';
import { Field, FilterChip, GlassButton, GlassHeader, Label, Muted, Screen, wrap } from './ui';

const ALL: RequestStatus[] = ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'RECUSADO', 'CANCELADO'];
const toggle = <T,>(a: T[] = [], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

export default function Filtros() {
  const p = useProfile();
  const nav = useNav();
  const { filters, setFilters, clear } = useFilters();
  const [f, setF] = useState(filters);
  const bases = p.todasAsBases ? null : p.bases; // com acesso total a lista de bases é livre (digitada)

  return (
    <Screen bottomBar={false}>
      <GlassHeader title="Filtros" />
      <Label>Base</Label>
      {bases ? (
        <View style={wrap}>{bases.map((b) => <FilterChip key={b} label={b} active={f.bases?.includes(b)} onPress={() => setF({ ...f, bases: toggle(f.bases, b) })} />)}</View>
      ) : (
        <Field label="Base (uma)" value={f.bases?.[0] ?? ''} onChangeText={(t) => setF({ ...f, bases: t ? [t.trim()] : undefined })} autoCapitalize="characters" />
      )}
      <Muted>A lista é limitada às bases autorizadas. A segurança real está nas regras do servidor.</Muted>
      <Label>Status</Label>
      <View style={wrap}>{ALL.map((s) => <FilterChip key={s} label={STATUS_LABEL[s]} active={f.status?.includes(s)} onPress={() => setF({ ...f, status: toggle(f.status, s) })} />)}</View>
      <Field label="De (AAAA-MM-DD)" value={f.de ?? ''} onChangeText={(t) => setF({ ...f, de: t || undefined })} keyboardType="numbers-and-punctuation" />
      <Field label="Até (AAAA-MM-DD)" value={f.ate ?? ''} onChangeText={(t) => setF({ ...f, ate: t || undefined })} keyboardType="numbers-and-punctuation" />
      <GlassButton label="Aplicar" variant="primary" onPress={() => { setFilters(f); nav.back(); }} />
      <GlassButton label="Limpar" onPress={() => { clear(); setF({}); nav.back(); }} />
      <GlassButton label="Voltar" onPress={() => nav.back()} />
    </Screen>
  );
}
