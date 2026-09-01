import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEntries, addEntry, updateEntry, deleteEntry } from '../utils/storage';
import EntryModal from '../components/EntryModal';
import SimpleBarChart from '../components/SimpleBarChart';
import { useLanguage } from '../context/LanguageContext';

export default function ProjectScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { projectId, projectName } = route.params;
  const [entries, setEntries] = useState([]);
  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [editingEntry, setEditingEntry] = useState(null); // entry being edited, or null for a new one

  const loadEntries = useCallback(async () => {
    const data = await getEntries(projectId);
    setEntries(data);
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: projectName });
      loadEntries();
    }, [loadEntries, navigation, projectName])
  );

  const totals = entries.reduce(
    (acc, e) => {
      if (e.type === 'income') acc.income += e.amount;
      else acc.expense += e.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const balance = totals.income - totals.expense;

  const closeModal = () => {
    setModalType(null);
    setEditingEntry(null);
  };

  const handleSaveEntry = async (entry) => {
    if (entry.id) {
      // Editing an existing entry — fix a mistake instead of adding a new row.
      await updateEntry(projectId, entry.id, entry);
    } else {
      await addEntry(projectId, entry);
    }
    closeModal();
    loadEntries();
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setModalType(entry.type);
  };

  const handleDeleteEntry = (entry) => {
    Alert.alert(t('deleteEntryTitle'), t('deleteEntryMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(projectId, entry.id);
          loadEntries();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('income')}</Text>
            <Text style={[styles.summaryValue, { color: '#2ECC71' }]}>
              +{totals.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('expense')}</Text>
            <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>
              -{totals.expense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('balance')}</Text>
            <Text style={[styles.summaryValue, { color: balance >= 0 ? '#1E2233' : '#E74C3C' }]}>
              {balance.toFixed(2)}
            </Text>
          </View>
        </View>

        <SimpleBarChart income={totals.income} expense={totals.expense} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noEntries')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => handleEditEntry(item)}
            onLongPress={() => handleDeleteEntry(item)}
          >
            <View style={styles.entryLeft}>
              <View
                style={[
                  styles.entryDot,
                  { backgroundColor: item.type === 'income' ? '#2ECC71' : '#E74C3C' },
                ]}
              />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.entryPerson}>
                  {item.person ? item.person : item.type === 'income' ? t('income') : t('expense')}
                </Text>
                {!!item.note && <Text style={styles.entryNote}>{item.note}</Text>}
                <Text style={styles.entryDate}>{new Date(item.date).toLocaleString()}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.entryAmount,
                { color: item.type === 'income' ? '#2ECC71' : '#E74C3C' },
              ]}
            >
              {item.type === 'income' ? '+' : '-'}
              {item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#E74C3C' }]}
          onPress={() => setModalType('expense')}
        >
          <Text style={styles.fabText}>{t('addExpense')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#2ECC71' }]}
          onPress={() => setModalType('income')}
        >
          <Text style={styles.fabText}>{t('addIncome')}</Text>
        </TouchableOpacity>
      </View>

      <EntryModal
        visible={!!modalType}
        type={modalType}
        initialValues={editingEntry}
        onClose={closeModal}
        onSave={handleSaveEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: '#8A8FA3', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#8A8FA3', marginTop: 40, fontSize: 14, lineHeight: 20 },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  entryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  entryPerson: { fontSize: 15, fontWeight: '600', color: '#1E2233' },
  entryNote: { fontSize: 12, color: '#8A8FA3', marginTop: 2 },
  entryDate: { fontSize: 11, color: '#B0B4C4', marginTop: 2 },
  entryAmount: { fontSize: 15, fontWeight: '700' },
  fabRow: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fab: {
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});