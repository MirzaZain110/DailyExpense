import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * Shown for ~2 seconds when the app launches, then replaces itself
 * with the Dashboard screen. Add this as the `initialRouteName` of
 * your Stack.Navigator in App.js:
 *
 *   <Stack.Navigator initialRouteName="Splash">
 *     <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
 *     <Stack.Screen name="Dashboard" component={DashboardScreen} ... />
 *     ...
 *   </Stack.Navigator>
 *
 * If your Dashboard route is named something other than "Dashboard",
 * update the navigation.replace(...) call below to match.
 */
export default function SplashScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Dashboard');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>$</Text>
        </View>
        <Text style={styles.appName}>Expense Tracker</Text>
        <Text style={styles.tagline}>Track. Save. Grow.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4C6FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 40, color: '#fff', fontWeight: '700' },
  appName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
});