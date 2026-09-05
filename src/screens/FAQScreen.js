import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function FAQScreen({ navigation }) {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState(null);

  React.useEffect(() => {
    navigation.setOptions({ title: t('faqScreenTitle') });
  }, [navigation, t]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {FAQ_KEYS.map((n, index) => {
        const isOpen = expandedIndex === index;
        return (
          <TouchableOpacity
            key={n}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setExpandedIndex(isOpen ? null : index)}
          >
            <View style={styles.questionRow}>
              <Text style={styles.question}>{t(`faq${n}Q`)}</Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#8A8FA3"
              />
            </View>
            {isOpen && <Text style={styles.answer}>{t(`faq${n}A`)}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E2233', paddingRight: 10 },
  answer: { fontSize: 13, color: '#6B7080', lineHeight: 19, marginTop: 12 },
});