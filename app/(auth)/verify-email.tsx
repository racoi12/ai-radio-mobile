import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'

export default function VerifyEmailScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email?: string }>()
  const verifyEmail = useAuthStore((s) => s.login)

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  async function handleVerify() {
    if (!otp.trim() || otp.length < 6) return
    setError('')
    setLoading(true)
    try {
      await api.verifyEmail(otp)
      setVerified(true)
      Alert.alert('Email verificado', 'Tu cuenta ha sido verificada. Ya puedes iniciar sesión.', [
        { text: 'Ir al login', onPress: () => router.replace('/(auth)/login') },
      ])
    } catch (err: any) {
      setError(err.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) return
    setLoading(true)
    try {
      await api.requestReset(email)
      Alert.alert('Revisa tu email', 'Te enviamos un nuevo código.')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.icon}>✉️</Text>
          <Text style={styles.title}>Verifica tu email</Text>
          <Text style={styles.subtitle}>
            {email
              ? `Ingresamos el código de 6 dígitos que enviamos a ${email}`
              : 'Ingresá el código de 6 dígitos que recibiste por email'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de verificación</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={loading}>
            <Text style={styles.resendText}>No recibiste el código? Reenviar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0a0f',
    padding: 24,
  },
  header: {
    paddingTop: 60,
    marginBottom: 20,
  },
  backLink: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  inputGroup: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendBtn: {
    marginTop: 20,
  },
  resendText: {
    color: '#9333ea',
    fontSize: 14,
  },
})
