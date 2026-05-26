import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type DemoScreenProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

type DemoButtonProps = {
  title: string;
  onPress: () => void;
};

export function DemoScreen({ title, eyebrow, children }: DemoScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </ScrollView>
  );
}

export function DemoButton({ title, onPress }: DemoButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
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
  },
  header: {
    gap: 8,
    paddingTop: 20,
  },
  eyebrow: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  statusText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
});
