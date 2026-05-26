import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';

type DemoScreenProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

type DemoButtonProps = {
  disabled?: boolean;
  title: string;
  onPress: () => void;
};

export function DemoScreen({ title, eyebrow, children }: DemoScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      scrollIndicatorInsets={styles.scrollIndicatorInsets}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </ScrollView>
  );
}

export function DemoButton({ disabled = false, title, onPress }: DemoButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function StatusText({ children }: { children: ReactNode }) {
  return (
    <View style={styles.status}>
      <Text selectable style={styles.statusText}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 22,
    paddingBottom: 128,
  },
  scrollIndicatorInsets: {
    bottom: 88,
  },
  header: {
    gap: 8,
    paddingTop: 20,
  },
  eyebrow: {
    color: colors.label,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.buttonBackground,
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabledBackground,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: colors.buttonDisabledText,
  },
  status: {
    backgroundColor: colors.panel,
    borderColor: colors.hairline,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
