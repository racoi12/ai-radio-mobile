import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryProvider } from '../src/components/AudioProvider'
import { useAuthStore } from '../src/store/authStore'

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [])

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" backgroundColor="#0a0a0f" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0a0a0f' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="podcast/[id]" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  )
}
