import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from './GlassSurface';
import { colors, radius, space } from './theme';
import type { AppRoute } from './access';

const LABEL: Record<AppRoute, string> = {
  inicio: 'Início', nova: 'Nova', solicitacoes: 'Pedidos', painel: 'Painel', notificacoes: 'Avisos', perfil: 'Perfil',
};
const ICON: Record<AppRoute, string> = {
  inicio: '⌂', nova: '＋', solicitacoes: '☰', painel: '◧', notificacoes: '🔔', perfil: '☺',
};

/** Barra de navegação de vidro. Mostra só as abas liberadas para o perfil. */
export function GlassTabBar({ routes, active, onSelect }: { routes: AppRoute[]; active: AppRoute; onSelect: (r: AppRoute) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <GlassSurface style={styles.bar}>
        {routes.map((r) => {
          const focused = r === active;
          return (
            <Pressable key={r} accessibilityRole="tab" accessibilityState={{ selected: focused }}
              onPress={() => onSelect(r)} style={[styles.item, focused && styles.itemActive]}>
              <Text style={[styles.icon, focused && { color: colors.accent }]}>{ICON[r]}</Text>
              <Text style={[styles.label, focused && { color: colors.text, fontWeight: '700' }]}>{LABEL[r]}</Text>
            </Pressable>
          );
        })}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md },
  bar: { flexDirection: 'row', borderRadius: radius.pill, padding: 6, gap: 4 },
  item: { flex: 1, minHeight: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  itemActive: { backgroundColor: 'rgba(255,255,255,0.14)' },
  icon: { fontSize: 20, color: colors.textMuted },
  label: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
