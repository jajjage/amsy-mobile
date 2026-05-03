import '../global.css';
import '@/lib/crypto-polyfill';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';

import { darkColors, lightColors } from '@/constants/palette';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { SoftLockProvider } from '@/context/SoftLockContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppRating } from '@/hooks/useAppRating';
import { useMobileNotificationNavigation } from '@/hooks/useMobileNotificationNavigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';


import { LoadingOverlay } from '@/components/LoadingOverlay';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

/**
 * Amsy Light Theme for React Navigation
 * Uses the Amsy brand colors
 */
const AmsyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,           // #2dd4bf - Amsy Primary
    background: lightColors.background,     // #FFFFFF
    card: lightColors.card,                 // #FFFFFF
    text: lightColors.foreground,           // #121212
    border: lightColors.border,             // #e5e7eb
    notification: lightColors.destructive,  // #ef4444
  },
};

/**
 * Amsy Dark Theme for React Navigation
 * Uses the Amsy brand colors with dark backgrounds
 */
const AmsyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,            // #2dd4bf - Amsy Primary
    background: darkColors.background,      // #262626
    card: darkColors.card,                  // #404040
    text: darkColors.foreground,            // #bfbfbf
    border: darkColors.border,              // #666666
    notification: darkColors.destructive,   // #330000
  },
};

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Start with onboarding for new users
  initialRouteName: '(onboarding)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Helper component to initialize app-wide logic that depends on providers
// Also handles the global loading overlay and Splash Screen hiding
function AppInitializer() {
  usePushNotifications();
  useMobileNotificationNavigation();
  useAppRating();
  
  const { isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading) {
      // Hide the native splash screen only when auth loading is complete
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  
  return <LoadingOverlay visible={isLoading} />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Removed early SplashScreen.hideAsync here - moved to AppInitializer

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark, colors } = useTheme();

  // Set the root view background color to match the theme
  // This prevents white flashes during navigation transitions
  useEffect(() => {
    const setRootBackground = async () => {
      await SystemUI.setBackgroundColorAsync(colors.background);
    };
    setRootBackground();
  }, [colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SoftLockProvider>
            <AppInitializer />
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <NavThemeProvider value={isDark ? AmsyDarkTheme : AmsyLightTheme}>
              <Stack screenOptions={{ animation: 'slide_from_right' }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(setup)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
                <Stack.Screen name="transactions" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="airtime" options={{ headerShown: false }} />
                <Stack.Screen name="data" options={{ headerShown: false }} />
                <Stack.Screen name="more-services" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
              <Toaster />
            </NavThemeProvider>
            </SoftLockProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}



