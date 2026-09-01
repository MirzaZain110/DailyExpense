import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * Popup shown when the user taps the red (Expense) or green (Income)
 * button on the project screen, AND when the user taps an existing
 * entry to fix a mistake.
 *
 * Pass `initialValues` (the existing entry) to open this in edit mode:
 * the fields are pre-filled, the title/button change to "Edit"/"Update",
 * and onSave receives the same entry back with its original id so the
 * caller can update it instead of creating a new one.
 */
export default function EntryModal({ visible, type, initialValues, onClose, onSave }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState('');
  const [note, setNote] = useState('');

  const isEditing = !!(initialValues && initialValues.id);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        setAmount(initialValues.amount != null ? String(initialValues.amount) : '');
        setPerson(initialValues.person || '');
        setNote(initialValues.note || '');
      } else {
        setAmount('');
        setPerson('');
        setNote('');
      }
    }
  }, [visible, initialValues]);

  const isExpense = type === 'expense';
  const accentColor = isExpense ? '#E74C3C' : '#2ECC71';

  const titleText = isEditing
    ? isExpense
      ? t('editExpenseTitle')
      : t('editIncomeTitle')
    : isExpense
    ? t('addExpenseTitle')
    : t('addIncomeTitle');

  const handleSave = () => {
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('invalidAmountTitle'), t('invalidAmountMessage'));
      return;
    }
    onSave({
      ...(isEditing ? { id: initialValues.id, date: initialValues.date } : { date: new Date().toISOString() }),
      type,
      amount: numericAmount,
      person: person.trim(),
      note: note.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.box}>
          <Text style={[styles.title, { color: accentColor }]}>{titleText}</Text>

          <Text style={styles.label}>{t('amountLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <Text style={styles.label}>
            {isExpense ? t('paidToLabel') : t('receivedFromLabel')}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('personPlaceholder')}
            value={person}
            onChangeText={setPerson}
          />

          <Text style={styles.label}>{t('noteLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('notePlaceholder')}
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accentColor }]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>{isEditing ? t('update') : t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, color: '#6B7080', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  button: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10, marginLeft: 10 },
  cancelButton: { backgroundColor: '#F0F1F5' },
  cancelText: { color: '#5A5F73', fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '600' },
});