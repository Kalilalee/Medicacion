import { Platform } from 'react-native';

export const colors = {
  background: '#F5F4EF',
  paper: '#FFFDF9',
  ink: '#202F28',
  muted: '#535E55',
  primary: '#30473B',
  primaryDeep: '#243A30',
  onPrimary: '#FAF8EF',
  onPrimaryMuted: '#D0D9CD',
  onPrimaryLine: '#586D5E',
  soft: '#E9EDE4',
  line: '#DBDFD4',
  fieldBorder: '#B8C1B6',
  placeholder: '#666F65',
  error: '#873F38',
  errorBackground: '#F6EAE5',
  overlay: '#202F2870',
};

export const serif = Platform.select({ web: 'Georgia', ios: 'Georgia', android: 'serif' });
export const wideLayout = 900;
