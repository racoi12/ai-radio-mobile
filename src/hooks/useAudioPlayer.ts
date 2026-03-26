import { useCallback, useEffect } from 'react'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { useAppStore } from '../store/appStore'

// Configure audio mode — wrapped in async IIFE to avoid top-level await
;(async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    })
  } catch (err) {
    console.warn('Audio mode setup failed:', err)
  }
})()

export function useAudioPlayer() {
  const {
    sound,
    isPlaying,
    currentPodcastId,
    playbackPosition,
    playbackDuration,
    isLoadingAudio,
    setSound,
    setIsPlaying,
    setCurrentPodcast,
    setPlaybackProgress,
    setLoadingAudio,
  } = useAppStore()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  // Play from URL (streaming)
  const playFromUrl = useCallback(
    async (podcastId: string, url: string) => {
      if (currentPodcastId === podcastId && sound) {
        const status = await sound.getStatusAsync()
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync()
            setIsPlaying(false)
          } else {
            await sound.playAsync()
            setIsPlaying(true)
          }
        }
        return
      }

      if (sound) {
        await sound.unloadAsync()
      }

      setLoadingAudio(true)
      setCurrentPodcast(podcastId)

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              setPlaybackProgress(
                status.positionMillis / 1000,
                (status.durationMillis || 0) / 1000
              )
              if (status.didJustFinish) {
                setIsPlaying(false)
                setCurrentPodcast(null)
              }
            }
          }
        )

        setSound(newSound)
        setIsPlaying(true)
      } catch (err) {
        console.error('Failed to play audio:', err)
        throw err
      } finally {
        setLoadingAudio(false)
      }
    },
    [currentPodcastId, sound]
  )

  // Placeholder for offline download (requires expo-file-system v55 API research)
  const downloadAndPlay = useCallback(
    async (podcastId: string, downloadUrl: string) => {
      // For now, stream directly — offline mode coming soon
      await playFromUrl(podcastId, downloadUrl)
    },
    [playFromUrl]
  )

  // Stop playback
  const stop = useCallback(async () => {
    if (sound) {
      await sound.stopAsync()
      setIsPlaying(false)
    }
  }, [sound])

  // Seek
  const seekTo = useCallback(
    async (positionSeconds: number) => {
      if (sound) {
        await sound.setPositionAsync(positionSeconds * 1000)
        setPlaybackProgress(positionSeconds, playbackDuration)
      }
    },
    [sound, playbackDuration]
  )

  return {
    sound,
    isPlaying,
    currentPodcastId,
    playbackPosition,
    playbackDuration,
    isLoadingAudio,
    playFromUrl,
    downloadAndPlay,
    stop,
    seekTo,
  }
}
