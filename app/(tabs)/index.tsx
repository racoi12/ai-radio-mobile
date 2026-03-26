import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import { useRouter } from 'expo-router'

const SUGGESTED_TOPICS = [
  'Historia de la filosofía estoica',
  'Cómo funcionan las redes neuronales',
  'La economía del siglo XXI',
  'Historia del jazz',
]

export default function HomeTab() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [topic, setTopic] = useState('')
  const [numSegments, setNumSegments] = useState(4)

  const mutation = useMutation({
    mutationFn: () => api.generateScript(topic, numSegments),
    onSuccess: (data) => {
      router.push(`/podcast/${data.podcastId}`)
    },
    onError: (err: Error) => {
      if (err.message.includes('401')) {
        Alert.alert('Sesión expirada', 'Por favor inicia sesión de nuevo.')
        router.replace('/(auth)/login')
      } else {
        Alert.alert('Error', err.message)
      }
    },
  })

  const topicsQuery = useQuery({
    queryKey: ['savedTopics'],
    queryFn: api.getSavedTopics,
  })

  function handleSelectTopic(t: string) {
    setTopic(t)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Radio</Text>
          <Text style={styles.subtitle}>
            Hola, {user?.name || user?.email?.split('@')[0]}
          </Text>
        </View>

        {/* Topic Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>¿Sobre qué tema quieres el podcast?</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Escribe un tema..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Segment Count */}
        <View style={styles.segmentsSection}>
          <Text style={styles.label}>Número de segmentos</Text>
          <View style={styles.segmentsRow}>
            {[2, 3, 4, 5, 6, 8].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.segmentBtn, numSegments === n && styles.segmentBtnActive]}
                onPress={() => setNumSegments(n)}
              >
                <Text
                  style={[styles.segmentBtnText, numSegments === n && styles.segmentBtnTextActive]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested Topics */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Temas sugeridos</Text>
          <View style={styles.suggestionsRow}>
            {SUGGESTED_TOPICS.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.suggestionChip}
                onPress={() => handleSelectTopic(t)}
              >
                <Text style={styles.suggestionText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saved Topics */}
        {topicsQuery.data?.topics && topicsQuery.data.topics.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Tus temas guardados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topicsQuery.data.topics.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.suggestionChip}
                  onPress={() => handleSelectTopic(t.topic)}
                >
                  <Text style={styles.suggestionText}>{t.topic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            (!topic.trim() || mutation.isPending) && styles.generateBtnDisabled,
          ]}
          onPress={() => mutation.mutate()}
          disabled={!topic.trim() || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.generateBtnText}>Generar Podcast</Text>
          )}
        </TouchableOpacity>

        {mutation.isPending && (
          <Text style={styles.generatingText}>
            Generando script... esto puede tardar ~20 segundos
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 14,
  },
  inputSection: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    borderRadius: 12,
    padding: 14,
    color: 'white',
    fontSize: 16,
    minHeight: 100,
  },
  segmentsSection: {
    marginBottom: 20,
    gap: 10,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  segmentBtnActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  segmentBtnText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: 'white',
  },
  suggestionsSection: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    color: '#d1d5db',
    fontSize: 13,
  },
  generateBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  generatingText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
  },
})
