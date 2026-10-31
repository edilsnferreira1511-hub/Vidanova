// Cores amostradas da logo da COOPMETRO (verde-escuro, verde, amarelo).
// AJUSTAR se o COOPMETRO XPT usar tokens oficiais diferentes.
export const colors = {
  bg: '#132306',
  bgElevated: '#1B3009',
  surface: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.16)',
  primary: '#0A9A26',
  primaryDark: '#007618',
  accent: '#F6E21F',
  text: '#F9FBF6',
  textMuted: 'rgba(249,251,246,0.68)',
  success: '#3DDC63',
  warning: '#F6B21F',
  danger: '#FF6B5E',
  info: '#6CB8FF',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const hit = { min: 52 }; // alvo mínimo de toque (botões grandes)

export const statusColor = {
  PENDENTE: colors.warning,
  EM_ANALISE: colors.info,
  APROVADO: colors.success,
  RECUSADO: colors.danger,
  CANCELADO: colors.textMuted,
} as const;
