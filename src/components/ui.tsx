import { ComponentType, PropsWithChildren, ReactNode, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TextInputProps, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, serif, wideLayout } from '../theme';
import { Check, CircleAlert, Clock3, Pill, X } from './icons';

type Icon = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function Page({ children, wide = false }: PropsWithChildren<{ wide?: boolean }>) {
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? 16 : width < 768 ? 24 : 36;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={[styles.page, wide && styles.widePage, { paddingHorizontal: gutter }]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ScreenHeader({ action }: { action?: ReactNode }) {
  return <View style={styles.header}><Brand />{action}</View>;
}

export function Intro({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.intro}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={[styles.title, width >= wideLayout && styles.largeTitle]}>{title}</Text>
      {description && <Text style={styles.subtitle}>{description}</Text>}
    </View>
  );
}

export function PrimaryButton({
  title, onPress, loading = false, secondary = false, disabled = false, icon: ButtonIcon, danger = false,
}: {
  title: string; onPress: () => void; loading?: boolean; secondary?: boolean; disabled?: boolean;
  icon?: Icon; danger?: boolean;
}) {
  const unavailable = loading || disabled;
  const foreground = secondary ? colors.primary : colors.onPrimary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      activeOpacity={0.76}
      style={[styles.button, secondary && styles.secondary, danger && styles.danger, disabled && styles.disabled]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : (
        <>
          {ButtonIcon && <ButtonIcon color={foreground} size={17} strokeWidth={1.7} />}
          <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function TextAction({ title, onPress, icon: ActionIcon, disabled = false }: {
  title: string; onPress: () => void; icon?: Icon; disabled?: boolean;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={title}
      accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={[styles.textAction, disabled && styles.disabled]}>
      {ActionIcon && <ActionIcon color={colors.primary} size={16} strokeWidth={1.7} />}
      <Text style={styles.link}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Field({ label, hint, style, onFocus, onBlur, ...props }: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        {...props}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, props.multiline && styles.multiline, focused && styles.focusedInput, style]}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Notice({ message, onDismiss, error = false }: {
  message: string; onDismiss?: () => void; error?: boolean;
}) {
  if (!message) return null;
  const NoticeIcon = error ? CircleAlert : Check;
  const foreground = error ? colors.error : colors.primary;

  return (
    <View style={[styles.notice, error && styles.errorNotice]}>
      <NoticeIcon size={18} color={foreground} strokeWidth={1.7} />
      <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite"
        style={[styles.noticeText, { color: foreground }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onDismiss}
          hitSlop={6} style={styles.dismiss}>
          <X size={16} color={foreground} strokeWidth={1.7} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Pill size={19} color={colors.onPrimary} strokeWidth={1.55} />
      </View>
      <Text style={styles.brandText}>Medicacion</Text>
    </View>
  );
}

export function AuthLayout({ children, title, description, back }: PropsWithChildren<{
  title: string; description: string; back?: ReactNode;
}>) {
  const { width } = useWindowDimensions();
  const split = width >= wideLayout;

  return (
    <Page wide={split}>
      <ScreenHeader />
      <View style={[styles.auth, split && styles.authSplit]}>
        {split && (
          <View style={styles.editorial}>
            <Text style={styles.editorialEyebrow}>RECORDATORIOS DE MEDICACIÓN</Text>
            <View style={styles.orbit} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.orbitMiddle}>
                <View style={styles.orbitCenter}>
                  <Clock3 color={colors.onPrimary} size={66} strokeWidth={0.85} />
                </View>
              </View>
            </View>
            <View style={styles.editorialCopy}>
              <Text style={styles.editorialTitle}>El cuidado tiene su tiempo.</Text>
              <Text style={styles.editorialBody}>Organizá tus medicamentos y encontrá el próximo aviso en un solo lugar.</Text>
            </View>
          </View>
        )}
        <View style={[styles.card, styles.authForm, split && styles.authFormWide]}>
          {back}
          <Intro eyebrow="TU RUTINA PERSONAL" title={title} description={description} />
          {children}
        </View>
      </View>
    </Page>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 656, alignSelf: 'center', paddingTop: 14, paddingBottom: 40, gap: 26 },
  widePage: { maxWidth: 1176 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, flexShrink: 1 },
  brandIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandText: { color: colors.ink, fontFamily: serif, fontSize: 27, lineHeight: 33, letterSpacing: -0.9, flexShrink: 1 },
  intro: { gap: 7 },
  title: { color: colors.ink, fontFamily: serif, fontSize: 38, lineHeight: 43, letterSpacing: -1.25 },
  largeTitle: { fontSize: 50, lineHeight: 55, letterSpacing: -1.9 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, maxWidth: 520 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, lineHeight: 15 },
  field: { gap: 7 },
  label: { color: colors.ink, fontWeight: '600', fontSize: 14, lineHeight: 19 },
  input: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: 10, minHeight: 49, paddingHorizontal: 13, paddingVertical: 12, fontSize: 16, color: colors.ink },
  focusedInput: { borderColor: colors.primary, backgroundColor: colors.soft },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: colors.primary, minHeight: 48, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.error },
  disabled: { opacity: 0.58 },
  textAction: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13, lineHeight: 19, flexShrink: 1 },
  card: { padding: 20, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.ink, fontFamily: serif, fontSize: 26, lineHeight: 31, letterSpacing: -0.45, flexShrink: 1 },
  notice: { backgroundColor: colors.soft, borderRadius: 11, padding: 12, gap: 9, flexDirection: 'row', alignItems: 'center' },
  errorNotice: { backgroundColor: colors.errorBackground },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20 },
  dismiss: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  auth: { gap: 20 },
  authSplit: { flexDirection: 'row', alignItems: 'stretch', gap: 26, marginTop: 12 },
  authForm: { padding: 22, gap: 17 },
  authFormWide: { flex: 1, minWidth: 0, padding: 36, justifyContent: 'center' },
  editorial: { flex: 1.12, minWidth: 0, borderRadius: 16, backgroundColor: colors.primaryDeep, padding: 36, justifyContent: 'space-between', gap: 24 },
  editorialEyebrow: { color: colors.onPrimaryMuted, fontSize: 10, lineHeight: 16, letterSpacing: 2, fontWeight: '700' },
  editorialCopy: { gap: 10 },
  editorialTitle: { fontFamily: serif, color: colors.onPrimary, fontSize: 43, lineHeight: 47, letterSpacing: -1.6, maxWidth: 375 },
  editorialBody: { color: colors.onPrimaryMuted, fontSize: 14, lineHeight: 22, maxWidth: 310 },
  orbit: { width: 222, height: 222, borderRadius: 111, borderWidth: 1, borderColor: colors.onPrimaryLine, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  orbitMiddle: { width: 174, height: 174, borderRadius: 87, borderWidth: 1, borderColor: colors.onPrimaryLine, justifyContent: 'center', alignItems: 'center' },
  orbitCenter: { width: 124, height: 124, borderRadius: 62, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});
