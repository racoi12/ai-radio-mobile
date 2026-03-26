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
import { useRouter, Link, useLocalSearchParams } from 'expo-router'
import * as api from '../../src/lib/api'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestReset() {
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await api.requestReset(email)
      setStep('code')
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!code.trim() || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.resetPassword(code.trim(), password)
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.', [
        { text: 'Ir al login', onPress: () => router.replace('/(auth)/login') },
      ])
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0a0a0f' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('email')}>
              <Text style={styles.backLink}>← Atrás</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.icon}>✉️</Text>
            <Text style={styles.title}>Ingresa el código</Text>
            <Text style={styles.subtitle}>
              Te enviamos un código de 6 dígitos a {email}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                style={styles.otpInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, (loading || code.length < 6 || !password) && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading || code.length < 6 || !password}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Restablecer contraseña</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleRequestReset}
              disabled={loading}
            >
              <Text style={styles.resendText}>No recibiste el código? Reenviar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.backLink}>← Volver</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Ingresa tu email y te enviaremos un código para restablecerla.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (loading || !email.trim()) && styles.buttonDisabled]}
            onPress={handleRequestReset}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Enviar código</Text>
            )}
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
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    borderRadius: 12,
    padding: 14,
    color: 'white',
    fontSize: 16,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  otpInput: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
    alignItems: 'center',
  },
  resendText: {
    color: '#9333ea',
    fontSize: 14,
  },
})
