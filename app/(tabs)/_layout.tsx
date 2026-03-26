import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🎙️',
    podcasts: '📻',
    profile: '👤',
  }
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={{ fontSize: 20 }}>{icons[name]}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111119',
          borderTopColor: '#1f1f2e',
          height: 70,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Generar',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="podcasts"
        options={{
          title: 'Mis Podcasts',
          tabBarIcon: ({ focused }) => <TabIcon name="podcasts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
  },
})
