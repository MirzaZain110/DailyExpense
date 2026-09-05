import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/context/LanguageContext';
import { setupNotificationChannel } from './src/utils/Notifications';

import SplashScreen from './src/components/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import FAQScreen from './src/screens/FAQScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerStyle: { backgroundColor: '#4C6FFF' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          >
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}