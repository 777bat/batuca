'use client'

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react'

interface WaveformPlayerProps {
    url: string
}

export default function WaveformPlayer({ url }: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!containerRef.current || !url) return

        setError(false)
        setIsLoading(true)

        // Always use an Audio element to bypass CORS restrictions
        // External audio hosts (cdn1.suno.ai, musicfile.removeai.ai) don't set CORS headers
        // WebAudio backend uses fetch() which is blocked by CORS
        // HTMLMediaElement plays audio regardless of CORS
        const audio = new Audio()
        audio.crossOrigin = 'anonymous'
        audio.preload = 'auto'
        audio.src = url

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#1e1e2e',
            progressColor: '#10b981',
            cursorColor: '#10b981',
            barWidth: 2,
            barRadius: 3,
            height: 48,
            normalize: true,
            media: audio,
        })

        wavesurferRef.current = ws

        ws.on('ready', () => {
            setIsLoading(false)
            setDuration(ws.getDuration())
        })

        ws.on('error', () => {
            // If crossOrigin fails, retry without it
            audio.crossOrigin = null as any
            audio.src = url
        })

        // If audio element itself errors (404, network), show error state
        audio.addEventListener('error', () => {
            setIsLoading(false)
            setError(true)
        })

        // Audio can play event - means it loaded successfully
        audio.addEventListener('canplay', () => {
            setIsLoading(false)
        })

        ws.on('play', () => setIsPlaying(true))
        ws.on('pause', () => setIsPlaying(false))
        ws.on('finish', () => setIsPlaying(false))
        ws.on('timeupdate', () => setCurrentTime(ws.getCurrentTime()))

        return () => {
            ws.destroy()
        }
    }, [url])

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause()
        }
    }

    const toggleMute = () => {
        if (wavesurferRef.current) {
            const nextMuted = !isMuted
            wavesurferRef.current.setMuted(nextMuted)
            setIsMuted(nextMuted)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (error) {
        return (
            <div className="w-full bg-[#111118]/50 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-400">Audio indisponivel - link temporario expirou</span>
            </div>
        )
    }

    return (
        <div className="w-full bg-[#111118]/50 border border-[#2a2a3a] rounded-2xl p-4 flex flex-col gap-3 group/player hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-emerald-600/10"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                </button>

                <div className="flex-1 min-w-0 relative">
                    <div ref={containerRef} className="w-full" />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/40 rounded-lg">
                            <span className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-bold">Carregando...</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleMute}
                    className="p-2 text-[#555568] hover:text-emerald-500 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-[#555568] tabular-nums">
                    {formatTime(currentTime)}
                </span>
                <span className="text-[10px] font-medium text-[#555568] tabular-nums">
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    )
}
