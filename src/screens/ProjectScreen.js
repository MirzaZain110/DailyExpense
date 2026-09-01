import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEntries, addEntry, updateEntry, deleteEntry } from '../utils/storage';
import { exportProjectToPdf } from '../utils/pdfExport';
import EntryModal from '../components/EntryModal';
import SimpleBarChart from '../components/SimpleBarChart';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = ['all', 'income', 'expense'];

export default function ProjectScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { projectId, projectName, projectCreatedAt } = route.params;
  const [entries, setEntries] = useState([]);
  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [editingEntry, setEditingEntry] = useState(null); // entry being edited, or null for a new one
  const [filterType, setFilterType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportPickerVisible, setExportPickerVisible] = useState(false);

  const loadEntries = useCallback(async () => {
    const data = await getEntries(projectId);
    setEntries(data);
  }, [projectId]);

  const filteredEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (query) {
        const haystack = `${e.person || ''} ${e.note || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [entries, filterType, searchText]);

  // The export scope picker reads whichever entries exist at the moment
  // the user confirms a scope, so keep a ref of the full (unfiltered)
  // list in sync for it to read.
  const entriesRef = React.useRef(entries);
  entriesRef.current = entries;

  const runExport = useCallback(
    async (scope) => {
      setExportPickerVisible(false);
      setExporting(true);
      try {
        const scopedEntries =
          scope === 'all' ? entriesRef.current : entriesRef.current.filter((e) => e.type === scope);
        const filterLabel =
          scope === 'all' ? null : scope === 'income' ? t('filterIncome') : t('filterExpense');

        await exportProjectToPdf({
          projectName,
          entries: scopedEntries,
          filterLabel,
        });
      } catch (e) {
        Alert.alert(t('exportError'));
      } finally {
        setExporting(false);
      }
    },
    [projectName, t]
  );

  const openExportPicker = useCallback(() => {
    setExportPickerVisible(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        title: projectName,
        headerRight: () => (
          <TouchableOpacity
            onPress={openExportPicker}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="document-text-outline" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        ),
      });
      loadEntries();
    }, [loadEntries, navigation, projectName, openExportPicker, exporting])
  );

  const totals = filteredEntries.reduce(
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
      {!!projectCreatedAt && (
        <Text style={styles.projectCreatedText}>
          {t('createdLabel')}: {new Date(projectCreatedAt).toLocaleString()}
        </Text>
      )}

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

      <View style={styles.filterBar}>
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filterType === f && styles.chipActive]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.chipText, filterType === f && styles.chipTextActive]}>
                {f === 'all' ? t('filterAll') : f === 'income' ? t('filterIncome') : t('filterExpense')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#A0A4B8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {entries.length === 0 ? t('noEntries') : t('noEntriesFiltered')}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
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
                <Text style={styles.entryDate}>
                  {t('addedLabel')}: {new Date(item.date).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.entryRight}>
              <Text
                style={[
                  styles.entryAmount,
                  { color: item.type === 'income' ? '#2ECC71' : '#E74C3C' },
                ]}
              >
                {item.type === 'income' ? '+' : '-'}
                {item.amount.toFixed(2)}
              </Text>
              <View style={styles.entryActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEditEntry(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={17} color="#6B7080" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteEntry(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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

      {/* Export scope picker — asks whether to export All / Income / Expense
          transactions for this project before generating the PDF. */}
      <Modal
        visible={exportPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.exportOverlay}
          activeOpacity={1}
          onPress={() => setExportPickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.exportBox}>
            <Text style={styles.exportTitle}>{t('exportConfirmTitle')}</Text>
            <Text style={styles.exportMessage}>
              {t('exportConfirmMessage')} "{projectName}"?
            </Text>

            <TouchableOpacity style={styles.exportOption} onPress={() => runExport('all')}>
              <Ionicons name="albums-outline" size={18} color="#4C6FFF" />
              <Text style={styles.exportOptionText}>{t('filterAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={() => runExport('income')}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="#2ECC71" />
              <Text style={styles.exportOptionText}>{t('filterIncome')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={() => runExport('expense')}>
              <Ionicons name="arrow-up-circle-outline" size={18} color="#E74C3C" />
              <Text style={styles.exportOptionText}>{t('filterExpense')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCancel}
              onPress={() => setExportPickerVisible(false)}
            >
              <Text style={styles.exportCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  projectCreatedText: {
    fontSize: 11,
    color: '#8A8FA3',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerButton: { paddingHorizontal: 8, paddingVertical: 4 },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 12,
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
  filterBar: { paddingHorizontal: 20, marginBottom: 10 },
  chipRow: { flexDirection: 'row', marginBottom: 10 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#EDEEF3',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#4C6FFF' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#5A5F73' },
  chipTextActive: { color: '#fff' },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E3EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
  },
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
  entryRight: { alignItems: 'flex-end' },
  entryAmount: { fontSize: 15, fontWeight: '700' },
  entryActions: { flexDirection: 'row', marginTop: 6 },
  iconButton: { marginLeft: 12 },
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
  exportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  exportBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 340,
  },
  exportTitle: { fontSize: 17, fontWeight: '700', color: '#1E2233', marginBottom: 6 },
  exportMessage: { fontSize: 13, color: '#6B7080', marginBottom: 16, lineHeight: 18 },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F5F6FA',
    marginBottom: 8,
  },
  exportOptionText: { fontSize: 14, fontWeight: '600', color: '#1E2233', marginLeft: 10 },
  exportCancel: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  exportCancelText: { fontSize: 14, fontWeight: '600', color: '#8A8FA3' },
});