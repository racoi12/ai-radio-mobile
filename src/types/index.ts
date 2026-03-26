export interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  email_verified: boolean
}

export interface Podcast {
  id: string
  title: string
  topic: string
  script_json: string
  audio_path?: string | null
  total_duration?: number
  created_at: number
}

export interface PodcastScript {
  title: string
  description: string
  totalDuration: string
  hostA: { name: string; description: string; voiceId: string }
  hostB: { name: string; description: string; voiceId: string }
  segments: Segment[]
}

export interface Segment {
  id: string
  title: string
  duration: string
  lines: DialogLine[]
}

export interface DialogLine {
  speaker: 'A' | 'B'
  text: string
  emotion?: string
}

export interface SubscriptionTier {
  id: string
  name: string
  podcastsPerMonth: number | null // null = unlimited
  canDownload: boolean
  price: string
}
