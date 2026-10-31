import React from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from './GlassSurface';
import { colors, hit, radius, space, statusColor } from './theme';
import { STATUS_LABEL } from './status';
import type { RequestStatus } from './types';

export const logo = require('./logo.jpg');

/** Tela com fundo da marca, rolagem e espaço para a barra de navegação de vidro. */
export function Screen({ children, scroll = true, bottomBar = true }: { children: React.ReactNode; scroll?: boolean; bottomBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + space.sm, paddingBottom: bottomBar ? 110 + insets.bottom : insets.bottom + space.lg };
  if (!scroll) return <View style={[styles.screen, pad, { paddingHorizontal: space.md }]}>{children}</View>;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[pad, { paddingHorizontal: space.md, gap: space.md }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

/** Barra superior de vidro. */
export function GlassHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <GlassSurface style={styles.header}>
      <Image source={logo} style={styles.headerLogo} />
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.muted} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </GlassSurface>
  );
}

interface BtnProps {
  label: string;
  onPress?: () => void;
  variant?: 'glass' | 'primary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Botão grande (≥52 px) com vidro. */
export function GlassButton({ label, onPress, variant = 'glass', loading, disabled, style }: BtnProps) {
  const tint = variant === 'primary' ? 'rgba(10,154,38,0.55)' : variant === 'danger' ? 'rgba(255,107,94,0.40)' : undefined;
  const off = disabled || loading;
  return (
    <Pressable onPress={off ? undefined : onPress} accessibilityRole="button" accessibilityState={{ disabled: off }}
      style={({ pressed }) => [{ opacity: off ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      <GlassSurface interactive tint={tint} strong style={styles.button}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{label}</Text>}
      </GlassSurface>
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const body = <View style={[styles.card, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>{body}</Pressable> : body;
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const c = statusColor[status];
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <Text style={[styles.badgeText, { color: c }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

/** Chip de filtro (vidro). */
export function FilterChip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      <GlassSurface tint={active ? 'rgba(10,154,38,0.55)' : undefined} style={styles.chip}>
        <Text style={[styles.chipText, active && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      </GlassSurface>
    </Pressable>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'info' | 'warning'; children: React.ReactNode }) {
  const c = { error: colors.danger, success: colors.success, info: colors.info, warning: colors.warning }[kind];
  return (
    <View style={[styles.banner, { borderColor: c, backgroundColor: c + '22' }]} accessibilityRole="alert">
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>{children}</Text>
    </View>
  );
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={[styles.muted, { marginTop: space.sm }]}>{label}</Text>
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={[styles.center, { paddingVertical: space.xl }]}>
      <Text style={styles.h2}>{title}</Text>
      {hint ? <Text style={[styles.muted, { textAlign: 'center', marginTop: 4 }]}>{hint}</Text> : null}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, props.multiline && { height: 110, textAlignVertical: 'top', paddingTop: 14 }]} {...props} />
    </View>
  );
}

export const Label = ({ children }: { children: React.ReactNode }) => <Text style={styles.label}>{children}</Text>;
export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h1}>{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h2}>{children}</Text>;
export const Muted = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={[styles.muted, style]}>{children}</Text>;
export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={[styles.body, style]}>{children}</Text>;

export const row: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: space.sm };
export const wrap: ViewStyle = { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm };

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg },
  headerLogo: { width: 44, height: 44, borderRadius: 12 },
  headerTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  button: { minHeight: hit.min, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  chip: { minHeight: 44, borderRadius: radius.pill, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.textMuted, fontSize: 15 },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: space.md },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.lg },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  input: { minHeight: hit.min, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: 17, paddingHorizontal: space.md },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800' },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 14 },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
});
