import { create } from 'zustand'
import { Audio, AVPlaybackStatus } from 'expo-av'

interface AppState {
  // Audio player
  sound: Audio.Sound | null
  isPlaying: boolean
  currentPodcastId: string | null
  playbackPosition: number
  playbackDuration: number
  isLoadingAudio: boolean

  // Subscriptions (placeholder for RevenueCat)
  isSubscribed: boolean
  podcastsUsedThisMonth: number
  maxPodcastsFree: number

  // Actions
  setSound: (sound: Audio.Sound | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentPodcast: (id: string | null) => void
  setPlaybackProgress: (position: number, duration: number) => void
  setLoadingAudio: (loading: boolean) => void
  setSubscriptionStatus: (isSubscribed: boolean, podcastsUsed: number, maxFree: number) => void
  incrementPodcastsUsed: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sound: null,
  isPlaying: false,
  currentPodcastId: null,
  playbackPosition: 0,
  playbackDuration: 0,
  isLoadingAudio: false,
  isSubscribed: false,
  podcastsUsedThisMonth: 0,
  maxPodcastsFree: 3,

  setSound: (sound) => set({ sound }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentPodcast: (id) => set({ currentPodcastId: id }),
  setPlaybackProgress: (position, duration) =>
    set({ playbackPosition: position, playbackDuration: duration }),
  setLoadingAudio: (loading) => set({ isLoadingAudio: loading }),
  setSubscriptionStatus: (isSubscribed, podcastsUsed, maxFree) =>
    set({ isSubscribed, podcastsUsedThisMonth: podcastsUsed, maxPodcastsFree: maxFree }),
  incrementPodcastsUsed: () =>
    set((state) => ({ podcastsUsedThisMonth: state.podcastsUsedThisMonth + 1 })),
}))
