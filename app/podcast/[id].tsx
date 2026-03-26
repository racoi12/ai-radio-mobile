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
import { useTTSPlayer } from '../../src/hooks/useTTSPlayer'
import { PodcastScript, Segment } from '../../src/types'

function SegmentCard({
  segment,
  index,
  isCurrent,
  isPlaying,
  onPress,
}: {
  segment: Segment
  index: number
  isCurrent: boolean
  isPlaying: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.segmentCard, isCurrent && isPlaying && styles.segmentCardActive]}
      onPress={onPress}
    >
      <View style={styles.segmentHeader}>
        <View style={[styles.segmentBadge, isCurrent && isPlaying && styles.segmentBadgeActive]}>
          <Text style={styles.segmentBadgeText}>{index + 1}</Text>
        </View>
        <View style={styles.segmentInfo}>
          <Text style={[styles.segmentTitle, isCurrent && isPlaying && styles.segmentTitleActive]}>
            {segment.title}
          </Text>
          <Text style={styles.segmentDuration}>{segment.duration}</Text>
        </View>
        {isCurrent && isPlaying && (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingDot}>●</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function PodcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { playFromUrl, isPlaying: isAvPlaying, currentPodcastId, playbackPosition, playbackDuration, isLoadingAudio, stop: stopAv } =
    useAudioPlayer()

  const podcastId = Array.isArray(id) ? id[0] : id

  const { data, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => api.getPodcast(podcastId!),
    enabled: !!podcastId,
  })

  const podcast = data?.podcast
  let script: PodcastScript | null = null
  if (podcast) {
    try { script = JSON.parse(podcast.script_json) } catch {}
  }

  // Start MP3 generation in background when using TTS
  const handleStartGenerating = async () => {
    if (!podcastId) return
    try {
      await api.generateAudio(podcastId)
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] })
    } catch {}
  }

  // TTS player (used when no audio file yet)
  const tts = useTTSPlayer({
    segments: script?.segments || [],
    hostA: script?.hostA || { name: 'Anfitrión A' },
    hostB: script?.hostB || { name: 'Anfitrión B' },
    onDone: () => {},
    onStartGeneratingMP3: handleStartGenerating,
  })

  // When MP3 becomes available, switch to it
  const hasAudio = !!podcast?.audio_path

  // AV player for when MP3 is available
  function handlePlayAv() {
    if (!podcastId) return
    const url = api.getDownloadUrl(podcastId)
    playFromUrl(podcastId, url)
  }

  function handleStopAv() {
    stopAv()
  }

  // Unified controls
  const isCurrentlyPlaying = hasAudio ? isAvPlaying : tts.isPlaying
  const currentSegIdx = hasAudio ? 0 : tts.currentSegmentIdx

  function handleMainPlay() {
    if (hasAudio) {
      handlePlayAv()
    } else {
      if (tts.isPlaying) {
        tts.pause()
      } else {
        tts.play()
      }
    }
  }

  function handleMainStop() {
    if (hasAudio) {
      handleStopAv()
    } else {
      tts.pause()
    }
  }

  async function handleGenerateAudio() {
    if (!podcastId) return
    try {
      await api.generateAudio(podcastId)
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] })
      Alert.alert('Listo', 'Audio generado.')
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

  if (error || !podcast || !script) {
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
          <Text style={styles.title} numberOfLines={2}>{script.title}</Text>
          <Text style={styles.topic}>{podcast.topic}</Text>
        </View>

        {/* Player Controls */}
        <View style={styles.playerSection}>
          <TouchableOpacity
            style={[styles.playAllBtn, isLoadingAudio && styles.playAllBtnDisabled]}
            onPress={handleMainPlay}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.playAllBtnText}>
                {isCurrentlyPlaying ? '⏸ Pausar' : '▶ Escuchar'}
              </Text>
            )}
          </TouchableOpacity>

          {!hasAudio && !tts.isPlaying && !isLoadingAudio && (
            <TouchableOpacity style={styles.downloadBtn} onPress={handleGenerateAudio}>
              <Text style={styles.downloadBtnText}>↓ Generar MP3</Text>
            </TouchableOpacity>
          )}

          {!hasAudio && (
            <Text style={styles.audioPending}>
              {!tts.isPlaying ? 'Escucha ahora con TTS' : 'Reproduciendo con TTS...'}
            </Text>
          )}

          {hasAudio && (
            <Text style={styles.audioReady}>✓ Audio disponible</Text>
          )}
        </View>

        {/* Current line display (TTS mode) */}
        {!hasAudio && tts.isSpeaking && tts.currentLine && (
          <View style={styles.currentLineSection}>
            <Text style={styles.currentLineSpeaker}>
              {tts.currentLine.speaker === 'A' ? script.hostA.name : script.hostB.name}
            </Text>
            <Text style={styles.currentLineText}>{tts.currentLine.text}</Text>
          </View>
        )}

        {/* Progress (AV mode) */}
        {hasAudio && currentPodcastId === podcastId && playbackDuration > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${(playbackPosition / playbackDuration) * 100}%` }]}
              />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.progressTime}>{formatTime(playbackPosition)}</Text>
              <Text style={styles.progressTime}>{formatTime(playbackDuration)}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {script.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{script.description}</Text>
          </View>
        )}

        {/* Hosts */}
        {script.hostA && (
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
        {script.segments && (
          <View style={styles.segmentsSection}>
            <Text style={styles.sectionTitle}>Segmentos</Text>
            {script.segments.map((segment, index) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                index={index}
                isCurrent={index === tts.currentSegmentIdx}
                isPlaying={tts.isPlaying}
                onPress={() => !hasAudio && tts.skipToSegment(index)}
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
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 16 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#9333ea', fontSize: 14, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white', lineHeight: 28, marginBottom: 4 },
  topic: { color: '#6b7280', fontSize: 13 },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
  playAllBtnDisabled: { opacity: 0.5 },
  playAllBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  downloadBtn: { backgroundColor: '#065f46', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  downloadBtnText: { color: '#10b981', fontWeight: '600', fontSize: 13 },
  audioPending: { color: '#f59e0b', fontSize: 12, fontWeight: '500' },
  audioReady: { color: '#10b981', fontSize: 12, fontWeight: '500' },
  currentLineSection: {
    backgroundColor: '#111119',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#9333ea',
  },
  currentLineSpeaker: { color: '#9333ea', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  currentLineText: { color: '#d1d5db', fontSize: 14, lineHeight: 20 },
  progressSection: { marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#1f1f2e', borderRadius: 2, marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#9333ea', borderRadius: 2 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTime: { color: '#6b7280', fontSize: 11 },
  descriptionSection: { marginBottom: 16, padding: 14, backgroundColor: '#111119', borderRadius: 10 },
  description: { color: '#9ca3af', fontSize: 13, lineHeight: 20 },
  hostsSection: { marginBottom: 16 },
  sectionTitle: { color: '#6b7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  hostsRow: { flexDirection: 'row', gap: 10 },
  hostCard: { flex: 1, backgroundColor: '#111119', borderRadius: 10, padding: 12 },
  hostName: { color: 'white', fontWeight: '600', fontSize: 13, marginBottom: 2 },
  hostDesc: { color: '#6b7280', fontSize: 11 },
  segmentsSection: { marginBottom: 32 },
  segmentCard: { backgroundColor: '#111119', borderRadius: 10, padding: 12, marginBottom: 8 },
  segmentCardActive: { backgroundColor: '#1a1530', borderColor: '#9333ea', borderWidth: 1 },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segmentBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  segmentBadgeActive: { backgroundColor: '#9333ea' },
  segmentBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  segmentInfo: { flex: 1 },
  segmentTitle: { color: '#d1d5db', fontSize: 13, fontWeight: '500' },
  segmentTitleActive: { color: '#c084fc' },
  segmentDuration: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  playingIndicator: { alignItems: 'center', justifyContent: 'center' },
  playingDot: { color: '#9333ea', fontSize: 10 },
  errorText: { color: '#6b7280', fontSize: 16 },
})
