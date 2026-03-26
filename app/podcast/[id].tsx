import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as api from '../../src/lib/api'
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer'
import { PodcastScript, Segment } from '../../src/types'

function SegmentCard({
  segment,
  index,
  isPlaying,
  onPlay,
}: {
  segment: Segment
  index: number
  isPlaying: boolean
  onPlay: () => void
}) {
  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentBadgeText}>{index + 1}</Text>
        </View>
        <View style={styles.segmentInfo}>
          <Text style={styles.segmentTitle}>{segment.title}</Text>
          <Text style={styles.segmentDuration}>{segment.duration}</Text>
        </View>
        <TouchableOpacity style={styles.playSegmentBtn} onPress={onPlay}>
          <Text style={styles.playSegmentBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function PodcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { playFromUrl, isPlaying, currentPodcastId, playbackPosition, playbackDuration, isLoadingAudio } =
    useAudioPlayer()

  const podcastId = Array.isArray(id) ? id[0] : id

  const { data, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => api.getPodcast(podcastId!),
    enabled: !!podcastId,
  })

  const podcast = data?.podcast
  const script: PodcastScript | null = podcast ? JSON.parse(podcast.script_json) : null

  function handlePlayAll() {
    if (!podcastId) return
    const url = api.getDownloadUrl(podcastId)
    playFromUrl(podcastId, url)
  }

  async function handleGenerateAudio() {
    if (!podcastId) return
    try {
      await api.generateAudio(podcastId)
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] })
      Alert.alert('Listo', 'Audio generado. Pulsa ▶ para reproducir.')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    )
  }

  if (error || !podcast) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el podcast</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header - compact */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>{podcast.title}</Text>
          <Text style={styles.topic}>{podcast.topic}</Text>
        </View>

        {/* Player Controls */}
        <View style={styles.playerSection}>
          {podcast.audio_path ? (
            <TouchableOpacity
              style={[styles.playAllBtn, isLoadingAudio && styles.playAllBtnDisabled]}
              onPress={handlePlayAll}
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.playAllBtnText}>
                  {currentPodcastId === podcastId && isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.playAllBtn} onPress={handleGenerateAudio}>
              <Text style={styles.playAllBtnText}>↓ Generar Audio</Text>
            </TouchableOpacity>
          )}

          {!podcast.audio_path && !isLoadingAudio && (
            <Text style={styles.audioPending}>Audio no disponible — genera primero</Text>
          )}

          {podcast.audio_path && (
            <Text style={styles.audioReady}>✓ Audio disponible</Text>
          )}
        </View>

        {/* Progress */}
        {currentPodcastId === podcastId && playbackDuration > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(playbackPosition / playbackDuration) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.progressTime}>{formatTime(playbackPosition)}</Text>
              <Text style={styles.progressTime}>{formatTime(playbackDuration)}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {script?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{script.description}</Text>
          </View>
        )}

        {/* Hosts */}
        {script?.hostA && (
          <View style={styles.hostsSection}>
            <Text style={styles.sectionTitle}>Hosts</Text>
            <View style={styles.hostsRow}>
              <View style={styles.hostCard}>
                <Text style={styles.hostName}>🎙️ {script.hostA.name}</Text>
                <Text style={styles.hostDesc}>{script.hostA.description}</Text>
              </View>
              <View style={styles.hostCard}>
                <Text style={styles.hostName}>🎙️ {script.hostB.name}</Text>
                <Text style={styles.hostDesc}>{script.hostB.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Segments */}
        {script?.segments && (
          <View style={styles.segmentsSection}>
            <Text style={styles.sectionTitle}>Segmentos</Text>
            {script.segments.map((segment, index) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                index={index}
                isPlaying={false}
                onPlay={() => {}}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 28,
    marginBottom: 4,
  },
  topic: {
    color: '#6b7280',
    fontSize: 13,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  playAllBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playAllBtnDisabled: {
    opacity: 0.5,
  },
  playAllBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  downloadBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  downloadBtnText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  audioReady: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1f1f2e',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTime: {
    color: '#6b7280',
    fontSize: 11,
  },
  descriptionSection: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#111119',
    borderRadius: 10,
  },
  description: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 20,
  },
  hostsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hostsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hostCard: {
    flex: 1,
    backgroundColor: '#111119',
    borderRadius: 10,
    padding: 12,
  },
  hostName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  hostDesc: {
    color: '#6b7280',
    fontSize: 11,
  },
  segmentsSection: {
    marginBottom: 32,
  },
  segmentCard: {
    backgroundColor: '#111119',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  segmentInfo: {
    flex: 1,
  },
  segmentTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  segmentDuration: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 1,
  },
  playSegmentBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSegmentBtnText: {
    color: 'white',
    fontSize: 13,
  },
  errorText: {
    color: '#6b7280',
    fontSize: 16,
  },
})
