import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const TRACK_HEIGHT = 80;

/**
 * Minimal income vs expense bar chart.
 * No external chart library required — two Views with heights
 * proportional to the values, animated so the bars grow into place
 * whenever the totals change.
 */
export default function SimpleBarChart({ income, expense }) {
  const max = Math.max(income, expense, 1);
  const incomeTarget = Math.max((income / max) * TRACK_HEIGHT, income > 0 ? 6 : 0);
  const expenseTarget = Math.max((expense / max) * TRACK_HEIGHT, expense > 0 ? 6 : 0);

  const incomeAnim = useRef(new Animated.Value(0)).current;
  const expenseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(incomeAnim, {
      toValue: incomeTarget,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // height isn't supported by the native driver
    }).start();
  }, [incomeTarget]);

  useEffect(() => {
    Animated.timing(expenseAnim, {
      toValue: expenseTarget,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expenseTarget]);

  return (
    <View style={styles.container}>
      <View style={styles.barGroup}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[styles.bar, { height: incomeAnim, backgroundColor: '#2ECC71' }]}
          />
        </View>
        <Text style={styles.barLabel}>Income</Text>
      </View>

      <View style={styles.barGroup}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[styles.bar, { height: expenseAnim, backgroundColor: '#E74C3C' }]}
          />
        </View>
        <Text style={styles.barLabel}>Expense</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 110,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  barGroup: { alignItems: 'center', marginHorizontal: 26 },
  barTrack: {
    height: TRACK_HEIGHT,
    width: 34,
    justifyContent: 'flex-end',
    backgroundColor: '#F0F1F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { marginTop: 6, fontSize: 12, color: '#8A8FA3', fontWeight: '600' },
});