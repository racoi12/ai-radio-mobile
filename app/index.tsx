import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { user, isLoading, isInitialized } = useAuthStore()

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)" />
}
