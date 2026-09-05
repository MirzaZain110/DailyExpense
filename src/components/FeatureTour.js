import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { markTourSeen } from '../utils/storage';

/**
 * Shows a short sequence of "here's what this does" popups over a
 * screen, one at a time, the first time that screen is visited.
 *
 * Usage:
 *   const [showTour, setShowTour] = useState(false);
 *   useEffect(() => { (async () => {
 *     if (!(await isTourSeen('dashboard'))) setShowTour(true);
 *   })(); }, []);
 *
 *   <FeatureTour
 *     tourKey="dashboard"
 *     visible={showTour}
 *     onDone={() => setShowTour(false)}
 *     steps={[
 *       { title: t('tourDashboardAddProjectTitle'), text: t('tourDashboardAddProjectText') },
 *       { title: t('tourDashboardSettingsTitle'), text: t('tourDashboardSettingsText') },
 *     ]}
 *   />
 */
export default function FeatureTour({ tourKey, steps, visible, onDone }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  if (!visible || !steps || steps.length === 0) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const finish = async () => {
    await markTourSeen(tourKey);
    setIndex(0);
    onDone && onDone();
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>

          <View style={styles.dotsRow}>
            {steps.map((s, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={finish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>{t('tourSkip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>{isLast ? t('tourGotIt') : t('tourNext')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1E2233', marginBottom: 8 },
  text: { fontSize: 14, color: '#6B7080', lineHeight: 20, marginBottom: 18 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E1E3EB', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#4C6FFF', width: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipText: { fontSize: 13, fontWeight: '600', color: '#8A8FA3' },
  nextButton: { backgroundColor: '#4C6FFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});