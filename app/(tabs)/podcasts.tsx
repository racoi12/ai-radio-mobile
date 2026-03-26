import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as api from '../../src/lib/api'
import { Podcast } from '../../src/types'
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer'
import { useState } from 'react'

function PodcastCard({
  podcast,
  onPress,
  onPlay,
  onDownload,
  isPlaying,
  isLoadingAudio,
  hasAudio,
}: {
  podcast: Podcast
  onPress: () => void
  onPlay: () => void
  onDownload: () => void
  isPlaying: boolean
  isLoadingAudio: boolean
  hasAudio: boolean
}) {
  const date = new Date(podcast.created_at * 1000)
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {podcast.title}
        </Text>
        <Text style={styles.cardTopic} numberOfLines={1}>
          {podcast.topic}
        </Text>
        <Text style={styles.cardDate}>
          {date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {/* Play Button */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.playBtn]}
          onPress={onPlay}
          disabled={isLoadingAudio}
        >
          <Text style={styles.actionBtnText}>
            {isLoadingAudio ? '...' : isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Download Button */}
        <TouchableOpacity
          style={[styles.actionBtn, hasAudio ? styles.downloadedBtn : styles.downloadBtn]}
          onPress={onDownload}
        >
          <Text style={styles.actionBtnText}>{hasAudio ? '✓' : '↓'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default function PodcastsTab() {
  const router = useRouter()
  const { currentPodcastId, isPlaying, isLoadingAudio, playFromUrl } = useAudioPlayer()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['podcasts'],
    queryFn: api.getPodcasts,
  })

  async function handleDownload(podcast: Podcast) {
    try {
      await api.generateAudio(podcast.id)
      // Refresh list
      refetch()
    } catch (err: any) {
      console.error('Download failed:', err)
    }
  }

  function handlePlay(podcast: Podcast) {
    const url = api.getDownloadUrl(podcast.id)
    playFromUrl(podcast.id, url)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Podcasts</Text>
        <Text style={styles.subtitle}>
          {data?.total || 0} podcasts guardados
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : !data?.podcasts?.length ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tienes podcasts todavía</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.emptyLink}>Genera tu primero →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.podcasts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PodcastCard
              podcast={item}
              onPress={() => router.push(`/podcast/${item.id}`)}
              onPlay={() => handlePlay(item)}
              onDownload={() => handleDownload(item)}
              isPlaying={currentPodcastId === item.id && isPlaying}
              isLoadingAudio={currentPodcastId === item.id && isLoadingAudio}
              hasAudio={!!item.audio_path}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#9333ea"
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyLink: {
    color: '#9333ea',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#111119',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardTopic: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  cardDate: {
    color: '#4b5563',
    fontSize: 11,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: '#9333ea',
  },
  downloadBtn: {
    backgroundColor: '#065f46',
  },
  downloadedBtn: {
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
  },
})
