import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
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
    if (!podcast?.audio_path && !podcast?.id) return
    const url = api.getDownloadUrl(podcastId!)
    playFromUrl(podcastId!, url)
  }

  async function handleDownload() {
    try {
      await api.generateAudio(podcastId!)
      Alert.alert('Listo', 'Audio generado. Puedes reproducirlo ahora.')
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{podcast.title}</Text>
          <Text style={styles.topic}>{podcast.topic}</Text>
        </View>

        {/* Player Controls */}
        <View style={styles.playerSection}>
          <TouchableOpacity
            style={[styles.playAllBtn, (!podcast.audio_path && isLoadingAudio) && styles.playAllBtnDisabled]}
            onPress={handlePlayAll}
            disabled={!podcast.audio_path && !isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.playAllBtnText}>
                {currentPodcastId === podcastId && isPlaying ? '⏸ Pausar' : '▶ Reproducir Todo'}
              </Text>
            )}
          </TouchableOpacity>

          {!podcast.audio_path && (
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
              <Text style={styles.downloadBtnText}>↓ Generar MP3</Text>
            </TouchableOpacity>
          )}

          {podcast.audio_path && (
            <Text style={styles.audioReady}>✓ Audio disponible</Text>
          )}
        </View>

        {/* Progress */}
        {currentPodcastId === id && playbackDuration > 0 && (
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
  },
  backBtnText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 32,
    marginBottom: 8,
  },
  topic: {
    color: '#6b7280',
    fontSize: 14,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  playAllBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playAllBtnDisabled: {
    opacity: 0.5,
  },
  playAllBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  downloadBtn: {
    backgroundColor: '#065f46',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  downloadBtnText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  audioReady: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 20,
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
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#111119',
    borderRadius: 12,
  },
  description: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 22,
  },
  hostsSection: {
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
  hostsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  hostCard: {
    flex: 1,
    backgroundColor: '#111119',
    borderRadius: 12,
    padding: 14,
  },
  hostName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  hostDesc: {
    color: '#6b7280',
    fontSize: 12,
  },
  segmentsSection: {
    marginBottom: 40,
  },
  segmentCard: {
    backgroundColor: '#111119',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  segmentInfo: {
    flex: 1,
  },
  segmentTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentDuration: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  playSegmentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSegmentBtnText: {
    color: 'white',
    fontSize: 14,
  },
  errorText: {
    color: '#6b7280',
    fontSize: 16,
  },
})
