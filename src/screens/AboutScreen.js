import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * ⚠️ EDIT THIS: replace the placeholder values below with your real details.
 * This is the only place you need to change to update the About screen.
 */
const DEVELOPER_INFO = {
  name: 'Zain ul Abdin',
  email: 'zainulabdin.2629@gmail.com',
  contact: '+92 311 2275665',
};

export default function AboutScreen({ navigation }) {
  const { t } = useLanguage();

  React.useEffect(() => {
    navigation.setOptions({ title: t('about') });
  }, [navigation, t]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Row label={t('name')} value={DEVELOPER_INFO.name} />
        <Row label={t('email')} value={DEVELOPER_INFO.email} />
        <Row label={t('contact')} value={DEVELOPER_INFO.contact} isLast />
      </View>
    </View>
  );
}

function Row({ label, value, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F1F5' },
  label: { fontSize: 12, color: '#8A8FA3', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#1E2233' },
});