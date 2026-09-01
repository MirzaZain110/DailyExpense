import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen({ navigation }) {
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    navigation.setOptions({ title: t('settings') });
  }, [navigation, t]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <Text style={styles.sectionDescription}>{t('languageDescription')}</Text>

        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'en' && styles.languageOptionActive,
              { marginRight: 8 },
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>
              {t('english')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'ur' && styles.languageOptionActive,
              { marginLeft: 8 },
            ]}
            onPress={() => setLanguage('ur')}
          >
            <Text style={[styles.languageText, language === 'ur' && styles.languageTextActive]}>
              {t('urdu')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('About')}>
        <View style={styles.aboutRow}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.sectionTitle}>{t('about')}</Text>
            <Text style={styles.sectionDescription}>{t('aboutDescription')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E2233' },
  sectionDescription: { fontSize: 13, color: '#8A8FA3', marginTop: 4, lineHeight: 18 },
  languageRow: { flexDirection: 'row', marginTop: 16 },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F0F1F5',
    alignItems: 'center',
  },
  languageOptionActive: { backgroundColor: '#4C6FFF' },
  languageText: { fontSize: 14, fontWeight: '600', color: '#5A5F73' },
  languageTextActive: { color: '#fff' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { fontSize: 22, color: '#B0B4C4', marginLeft: 10 },
});