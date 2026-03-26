import { useCallback, useEffect, useRef, useState } from 'react'
import * as Speech from 'expo-speech'
import { Segment, DialogLine } from '../types'

interface UseTTSPlayerOptions {
  segments: Segment[]
  hostA: { name: string }
  hostB: { name: string }
  onDone?: () => void
  onStartGeneratingMP3?: () => void
}

export function useTTSPlayer({ segments, hostA, hostB, onDone, onStartGeneratingMP3 }: UseTTSPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0)
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isPlayingRef = useRef(false)
  const isGeneratingRef = useRef(false)

  // Flatten all lines
  const allLines: Array<{ segIdx: number; lineIdx: number; line: DialogLine }> = []
  segments.forEach((seg, si) => {
    seg.lines.forEach((l, li) => {
      allLines.push({ segIdx: si, lineIdx: li, line: l })
    })
  })

  const totalLines = allLines.length

  const speakLine = useCallback(
    (lineIdx: number) => {
      if (lineIdx >= totalLines || !isPlayingRef.current) return

      const { segIdx, lineIdx: lIdx, line: dl } = allLines[lineIdx]
      const speaker = dl.speaker === 'A' ? hostA.name : hostB.name
      const text = `${speaker}: ${dl.text}`

      setCurrentSegmentIdx(segIdx)
      setCurrentLineIdx(lIdx)
      setIsSpeaking(true)

      try {
        Speech.speak(text, {
          language: 'es-ES',
          pitch: 1.0,
          rate: 0.95,
          onDone: () => {
            if (!isPlayingRef.current) return
            if (lineIdx + 1 >= totalLines) {
              isPlayingRef.current = false
              setIsPlaying(false)
              setIsSpeaking(false)
              onDone?.()
            } else {
              speakLine(lineIdx + 1)
            }
          },
          onError: (err) => {
            console.warn('TTS speak error:', err)
            if (isPlayingRef.current) {
              speakLine(lineIdx + 1)
            }
          },
        })
      } catch (err) {
        console.warn('TTS engine unavailable:', err)
        isPlayingRef.current = false
        setIsPlaying(false)
        setIsSpeaking(false)
      }
    },
    [allLines, totalLines, hostA, hostB, onDone]
  )

  const play = useCallback(() => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true
    setIsPlaying(true)
    // Start MP3 generation in background (first time)
    if (!isGeneratingRef.current) {
      isGeneratingRef.current = true
      onStartGeneratingMP3?.()
    }
    speakLine(0)
  }, [speakLine, onStartGeneratingMP3])

  const pause = useCallback(() => {
    Speech.stop()
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsSpeaking(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const skipToSegment = useCallback(
    (idx: number) => {
      Speech.stop()
      const firstLineOfSeg = allLines.findIndex((l) => l.segIdx === idx)
      if (firstLineOfSeg >= 0) {
        speakLine(firstLineOfSeg)
      }
    },
    [allLines, speakLine]
  )

  useEffect(() => {
    return () => {
      Speech.stop()
    }
  }, [])

  return {
    isPlaying,
    isSpeaking,
    currentSegmentIdx,
    currentLineIdx,
    currentLine: allLines[currentSegmentIdx * totalLines + currentLineIdx]?.line,
    totalLines,
    play,
    pause,
    toggle,
    skipToSegment,
  }
}
