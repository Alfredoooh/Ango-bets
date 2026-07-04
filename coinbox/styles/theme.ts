// styles/theme.ts
export const COLORS = {
  light: {
    primary: '#1877F2',
    background: '#F0F2F5',
    surface: '#FFFFFF',
    appbar: '#FFFFFF',
    statusbar: '#FFFFFF',
    text: '#050505',
    textSecondary: '#65676B',
    border: '#CED0D4',
  },
  dark: {
    primary: '#2D88FF',
    background: '#0E0F10',
    surface: '#1C1D1F',
    appbar: '#1C1D1F',
    statusbar: '#0E0F10',
    text: '#E4E6EB',
    textSecondary: '#B0B3B8',
    border: '#3E4042',
  }
};

export const getDynamicColors = (isDark, customPrimary) => {
  const base = isDark ? COLORS.dark : COLORS.light;
  return {
    ...base,
    primary: customPrimary || base.primary,
  };
};