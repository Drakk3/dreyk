import { Text, View } from 'react-native';

export default function CompanionIndexRoute(): JSX.Element {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>DREYK COMPANION</Text>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.copy}>Expo baseline is running. Android is ready for the next rebuild step.</Text>
      </View>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    maxWidth: 320,
    padding: 24,
    width: '100%',
  },
  copy: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    backgroundColor: '#020617',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
};
