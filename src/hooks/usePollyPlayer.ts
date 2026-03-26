import { useCallback, useEffect, useRef, useState } from 'react'
import { writeAsStringAsync, readDirectoryAsync, deleteAsync, cacheDirectory } from 'expo-file-system/legacy'
import { EncodingType } from 'expo-file-system/legacy'
import * as SecureStore from 'expo-secure-store'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { Segment, DialogLine } from '../types'

// Configure audio mode
;(async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    })
  } catch {}
})()

interface UsePollyPlayerOptions {
  segments: Segment[]
  hostA: { name: string; voiceId: string }
  hostB: { name: string; voiceId: string }
  onDone?: () => void
}

export function usePollyPlayer({ segments, hostA, hostB, onDone }: UsePollyPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0)
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [currentLine, setCurrentLine] = useState<DialogLine | null>(null)
  const [error, setError] = useState<string | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const isPlayingRef = useRef(false)
  const cancelRef = useRef(false)

  // Flatten all lines
  const allLines: Array<{ segIdx: number; lineIdx: number; line: DialogLine }> = []
  segments.forEach((seg, si) => {
    seg.lines.forEach((l, li) => {
      allLines.push({ segIdx: si, lineIdx: li, line: l })
    })
  })

  const totalLines = allLines.length

  // Fetch and cache audio for a line
  const fetchAndCacheAudio = useCallback(
    async (lineIdx: number): Promise<string | null> => {
      if (lineIdx >= totalLines) return null
      const cacheFile = `${cacheDirectory}polly_${lineIdx}.mp3`

      // Check if already cached
      try {
        const exists = await readDirectoryAsync(cacheDirectory)
        if (exists.includes(`polly_${lineIdx}.mp3`)) {
          return cacheFile
        }
      } catch {}

      const { line } = allLines[lineIdx]
      const voiceId = line.speaker === 'A' ? hostA.voiceId : hostB.voiceId
      const cleanText = line.text.replace(/^Elena:\s*/i, '').replace(/^Marcos:\s*/i, '').trim()

      try {
        const token = await SecureStore.getItemAsync('auth_token')
        const res = await fetch(`https://radio.uat.argitic.com/api/generate-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: cleanText, voiceId }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!data.audioData) throw new Error('No audio data')

        // Write base64 to file using legacy API
        await writeAsStringAsync(cacheFile, data.audioData, {
          encoding: EncodingType.Base64,
        })
        return cacheFile
      } catch (err) {
        console.warn('Failed to fetch line audio:', err)
        return null
      }
    },
    [allLines, totalLines, hostA, hostB]
  )

  // Play a specific line
  const playLine = useCallback(
    async (lineIdx: number) => {
      if (lineIdx >= totalLines || !isPlayingRef.current || cancelRef.current) return

      const { segIdx, lineIdx: lIdx, line } = allLines[lineIdx]
      setCurrentSegmentIdx(segIdx)
      setCurrentLineIdx(lIdx)
      setCurrentLine(line)
      setIsLoading(true)
      setError(null)

      // Unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const cacheFile = await fetchAndCacheAudio(lineIdx)
      if (!cacheFile || !isPlayingRef.current || cancelRef.current) {
        setIsLoading(false)
        return
      }

      setIsLoading(false)

      const { sound } = await Audio.Sound.createAsync(
        { uri: cacheFile },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            if (!isPlayingRef.current || cancelRef.current) return
            if (lineIdx + 1 >= totalLines) {
              isPlayingRef.current = false
              setIsPlaying(false)
              setCurrentLine(null)
              onDone?.()
            } else {
              playLine(lineIdx + 1)
            }
          }
        }
      )

      soundRef.current = sound
      setIsPlaying(true)
    },
    [allLines, totalLines, fetchAndCacheAudio, onDone]
  )

  const play = useCallback(() => {
    if (isPlayingRef.current) return
    cancelRef.current = false
    isPlayingRef.current = true
    setIsPlaying(true)
    setError(null)
    playLine(0)
  }, [playLine])

  const pause = useCallback(async () => {
    isPlayingRef.current = false
    cancelRef.current = true
    if (soundRef.current) {
      await soundRef.current.stopAsync()
    }
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  const skipToSegment = useCallback(
    (idx: number) => {
      const firstLineOfSeg = allLines.findIndex((l) => l.segIdx === idx)
      if (firstLineOfSeg >= 0) {
        if (soundRef.current) {
          soundRef.current.stopAsync()
        }
        playLine(firstLineOfSeg)
      }
    },
    [allLines, playLine]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  return {
    isPlaying,
    isLoading,
    currentSegmentIdx,
    currentLineIdx,
    currentLine,
    error,
    play,
    pause,
    toggle,
    skipToSegment,
  }
}
