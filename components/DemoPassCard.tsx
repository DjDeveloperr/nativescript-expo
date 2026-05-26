import { Image, StyleSheet, Text, View } from 'react-native';
import { demoPass } from '../utils/demo-pass';

const expoLogo = require('../assets/demo-pass/expo-logo-preview.png');

export function DemoPassCard() {
  const [primary] = demoPass.storeCard.primaryFields;
  const [member, level] = demoPass.storeCard.secondaryFields;
  const [stack] = demoPass.storeCard.auxiliaryFields;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logoGroup}>
          <Image source={expoLogo} style={styles.logoImage} />
          <Text style={styles.logo}>{demoPass.logoText}</Text>
        </View>
        <Text style={styles.badge}>DEMO</Text>
      </View>
      <View style={styles.primary}>
        <Text style={styles.label}>{primary.label}</Text>
        <Text style={styles.value}>{primary.value}</Text>
      </View>
      <View style={styles.fields}>
        <Field label={member.label} value={member.value} />
        <Field label={level.label} value={level.value} />
        <Field label={stack.label} value={stack.value} />
      </View>
      <View style={styles.code}>
        <Text style={styles.codeText}>{demoPass.barcode.message}</Text>
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.smallValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 8,
    gap: 20,
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingRight: 12,
  },
  logoImage: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    width: 36,
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  primary: {
    gap: 4,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  fields: {
    flexDirection: 'row',
    gap: 14,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  smallValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  code: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  codeText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
