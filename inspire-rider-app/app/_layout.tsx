import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import client from '@/api/client';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      registerToken(expoPushToken);
    }
  }, [expoPushToken]);

  const registerToken = async (token: string) => {
    // Hardcoded rider_id for demo
    const riderId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    try {
      await client.post(`/riders/${riderId}/push-token`, { token });
      console.log('Push token registered with backend');
    } catch (e) {
      console.error('Failed to register push token', e);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AsyncStorage.getItem('user_profile');
      const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

      if (!user && !inAuthGroup) {
        // Redirect to register if not authenticated and not already in auth group
        router.replace('/register');
      } else if (user && inAuthGroup) {
        // Redirect to tabs if authenticated and trying to access auth group
        router.replace('/(tabs)');
      }
    };

    checkAuth();
  }, [segments]);

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <RootLayoutNav />
    </CustomThemeProvider>
  );
}
