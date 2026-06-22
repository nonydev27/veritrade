import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AnimatedSplash from '@/components/animated-splash';

// Keep native splash up until we manually hide it
SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Hide native splash — our animated splash takes over immediately
      await SplashScreen.hideAsync();
      setAppReady(true);
    })();
  }, []);

  const handleSplashFinish = async () => {
    setSplashDone(true);
    try {
      const onboarded = await AsyncStorage.getItem('hasOnboarded');
      const token     = await AsyncStorage.getItem('token');
      if (!onboarded) {
        router.replace('/onboarding');
      } else if (!token) {
        router.replace('/login');
      }
    } catch {}
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: '#060C1A' }}>
        <Stack>
          <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login"      options={{ headerShown: false }} />
          <Stack.Screen name="register"   options={{ headerShown: false }} />
          <Stack.Screen name="modal"      options={{ presentation: 'modal', title: 'Details' }} />
        </Stack>

        {/* Animated splash sits on top until finished */}
        {appReady && !splashDone && (
          <AnimatedSplash onFinish={handleSplashFinish} />
        )}
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
