import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation/AppNavigator';
import { useAuthStore } from './store/authStore';
import { Colors } from './theme/colors';

export default function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    if (!hasHydrated) return;
    void initializeAuth();
  }, [hasHydrated, initializeAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      {!hasHydrated || isBootstrapping ? (
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}
