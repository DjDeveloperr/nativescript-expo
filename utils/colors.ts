import { DynamicColorIOS, Platform } from 'react-native';

function dynamic(light: string, dark: string) {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark });
  }

  return light;
}

export const colors = {
  appBackground: dynamic('#f8fafc', '#020617'),
  buttonBackground: dynamic('#111827', '#f8fafc'),
  buttonDisabledBackground: dynamic('#cbd5e1', '#334155'),
  buttonDisabledText: dynamic('#64748b', '#94a3b8'),
  buttonText: dynamic('#ffffff', '#111827'),
  label: dynamic('#64748b', '#94a3b8'),
  textPrimary: dynamic('#111827', '#f8fafc'),
  transparent: 'transparent',
};
