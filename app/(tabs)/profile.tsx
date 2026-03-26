import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { useAppStore } from '../../src/store/appStore'
import { useQueryClient } from '@tanstack/react-query'

export default function ProfileTab() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { isSubscribed, podcastsUsedThisMonth, maxPodcastsFree } = useAppStore()
  const queryClient = useQueryClient()

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.role === 'admin' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        )}
      </View>

      {/* Subscription Card */}
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTitle}>
            {isSubscribed ? '🎉 Plan Pro' : '📻 Plan Gratuito'}
          </Text>
        </View>

        {!isSubscribed ? (
          <>
            <Text style={styles.usageText}>
              Has usado{' '}
              <Text style={styles.usageCount}>{podcastsUsedThisMonth}</Text> de{' '}
              <Text style={styles.usageLimit}>{maxPodcastsFree}</Text> podcasts este mes
            </Text>
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageBarFill,
                  { width: `${Math.min((podcastsUsedThisMonth / maxPodcastsFree) * 100, 100)}%` },
                ]}
              />
            </View>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeBtnText}>Actualizar a Pro</Text>
            </TouchableOpacity>
            <Text style={styles.proFeatures}>
              • Podcasts ilimitados{'\n'}• Descarga MP3{'\n'}• Escuchar offline
            </Text>
          </>
        ) : (
          <Text style={styles.proStatus}>Disfruta de podcasts ilimitados 🎙️</Text>
        )}
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email verificado</Text>
          <Text style={[styles.infoValue, user?.email_verified && styles.verified]}>
            {user?.email_verified ? '✓ Sí' : '✗ No'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>AI Radio v1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionCard: {
    backgroundColor: '#111119',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  subscriptionHeader: {
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  usageText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  usageCount: {
    color: '#9333ea',
    fontWeight: 'bold',
  },
  usageLimit: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  usageBar: {
    height: 6,
    backgroundColor: '#1f1f2e',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#9333ea',
    borderRadius: 3,
  },
  subscribeBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  proFeatures: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
  },
  proStatus: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    backgroundColor: '#111119',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  infoValue: {
    color: 'white',
    fontSize: 14,
  },
  verified: {
    color: '#10b981',
  },
  logoutBtn: {
    backgroundColor: '#1f1f2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  appVersion: {
    color: '#4b5563',
    fontSize: 12,
  },
})
