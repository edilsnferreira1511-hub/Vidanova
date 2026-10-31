import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors } from './theme';

// Efeito de vidro: usa expo-glass-effect SOMENTE se o dispositivo suportar (iOS com Liquid Glass).
// Em Android/web/iOS antigo usa um vidro "falso" coerente (translúcido + borda; blur no web).
// Compatibilidade da versão instalada NÃO foi verificada nesta etapa (sem acesso ao registro npm).
function nativeGlassSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}
const SUPPORTED = nativeGlassSupported();
export const glassIsNative = SUPPORTED;

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  interactive?: boolean;
  tint?: string;
  strong?: boolean;
}

export function GlassSurface({ style, children, interactive, tint, strong }: Props) {
  if (SUPPORTED) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={tint} style={style}>
        {children}
      </GlassView>
    );
  }
  const web = Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as object)
    : null;
  return (
    <View
      style={[
        styles.fallback,
        { backgroundColor: tint ?? (strong ? colors.surfaceStrong : colors.surface) },
        web,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.border, overflow: 'hidden' },
});
