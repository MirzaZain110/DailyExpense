import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../context/LanguageContext';
import { getNotificationSettings, saveNotificationSettings } from '../utils/storage';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../utils/Notifications';

function timeToLabel(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SettingsScreen({ navigation }) {
  const { language, setLanguage, t } = useLanguage();
  const [notif, setNotif] = useState({ enabled: false, hour: 12, minute: 0 });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({ title: t('settings') });
  }, [navigation, t]);

  useEffect(() => {
    (async () => {
      const saved = await getNotificationSettings();
      setNotif(saved);
      setLoaded(true);
    })();
  }, []);

  const persistAndApply = async (updated) => {
    setNotif(updated);
    await saveNotificationSettings(updated);
    if (updated.enabled) {
      await scheduleDailyReminder(updated.hour, updated.minute, t('reminderTitle'), t('reminderBody'));
    } else {
      await cancelDailyReminder();
    }
  };

  const handleToggle = async (value) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(t('notifications'), t('notificationPermissionDenied'));
        return;
      }
    }
    await persistAndApply({ ...notif, enabled: value });
  };

  const handleTimeChange = async (event, selectedDate) => {
    // Android's picker is a one-shot dialog; iOS keeps an inline/spinner
    // picker open until the user is done, so only auto-close on Android.
    if (Platform.OS === 'android') setPickerVisible(false);
    if (event.type === 'dismissed' || !selectedDate) return;

    const updated = { ...notif, hour: selectedDate.getHours(), minute: selectedDate.getMinutes() };
    await persistAndApply(updated);
  };

  if (!loaded) return <View style={styles.container} />;

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

      <View style={styles.card}>
        <View style={styles.notifHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>
            <Text style={styles.sectionDescription}>{t('notificationsDescription')}</Text>
          </View>
          <Switch
            value={notif.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#E1E3EB', true: '#B7C4FF' }}
            thumbColor={notif.enabled ? '#4C6FFF' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.timeRow, !notif.enabled && styles.timeRowDisabled]}
          onPress={() => notif.enabled && setPickerVisible(true)}
          disabled={!notif.enabled}
        >
          <Text style={styles.timeLabel}>{t('reminderTime')}</Text>
          <Text style={styles.timeValue}>{timeToLabel(notif.hour, notif.minute)}</Text>
        </TouchableOpacity>

        {pickerVisible && (
          <DateTimePicker
            value={(() => {
              const d = new Date();
              d.setHours(notif.hour, notif.minute, 0, 0);
              return d;
            })()}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {Platform.OS === 'ios' && pickerVisible && (
          <TouchableOpacity style={styles.doneButton} onPress={() => setPickerVisible(false)}>
            <Text style={styles.doneButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        )}
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
  notifHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F5',
  },
  timeRowDisabled: { opacity: 0.4 },
  timeLabel: { fontSize: 14, fontWeight: '600', color: '#1E2233' },
  timeValue: { fontSize: 14, fontWeight: '700', color: '#4C6FFF' },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#4C6FFF',
    borderRadius: 8,
    marginTop: 8,
  },
  doneButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});