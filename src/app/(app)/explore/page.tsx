'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, Download, Eye, Video, Image, Music, TrendingUp, Clock, Star, Flame } from 'lucide-react'

const filters = [
    { id: 'all', label: 'Todos', icon: Flame },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recentes', icon: Clock },
    { id: 'top', label: 'Top da semana', icon: Star },
    { id: 'image', label: 'Imagens', icon: Image },
    { id: 'video', label: 'Vídeos', icon: Video },
    { id: 'audio', label: 'Músicas', icon: Music },
]

const demoItems = [
    { id: '1', type: 'image', prompt: 'Cyberpunk city at sunset, neon lights reflecting on wet streets', author: 'creator1', likes: 342, views: 2109, emoji: '🌆' },
    { id: '2', type: 'video', prompt: 'Eagle soaring over mountain peaks, slow motion', author: 'creator2', likes: 891, views: 5432, emoji: '🦅', tall: true },
    { id: '3', type: 'image', prompt: 'Abstract fluid art in deep purple and gold', author: 'creator3', likes: 234, views: 1876, emoji: '🎨' },
    { id: '4', type: 'audio', prompt: 'Jazz piano trio late night session', author: 'creator4', likes: 156, views: 873, emoji: '🎷' },
    { id: '5', type: 'image', prompt: 'Magical enchanted forest with glowing mushrooms and fireflies', author: 'creator5', likes: 567, views: 3201, emoji: '🌿', tall: true },
    { id: '6', type: 'video', prompt: 'Ocean waves crashing on rocky cliffs at golden hour', author: 'creator6', likes: 423, views: 2654, emoji: '🌊' },
    { id: '7', type: 'image', prompt: 'Portrait of an astronaut in vintage spacesuit on Mars', author: 'creator7', likes: 789, views: 4321, emoji: '👨‍🚀' },
    { id: '8', type: 'audio', prompt: 'Epic orchestral battle theme with choir', author: 'creator8', likes: 312, views: 1987, emoji: '🎻' },
    { id: '9', type: 'image', prompt: 'Futuristic Tokyo street food market at night', author: 'creator9', likes: 445, views: 2876, emoji: '🍜', tall: true },
    { id: '10', type: 'video', prompt: 'Time lapse of Northern Lights dancing across the sky', author: 'creator10', likes: 1234, views: 8765, emoji: '🌌' },
    { id: '11', type: 'image', prompt: 'Realistic oil painting of a pirate ship in stormy seas', author: 'creator11', likes: 298, views: 1654, emoji: '⛵' },
    { id: '12', type: 'audio', prompt: 'Chill lo-fi beats with rain sounds and smooth piano', author: 'creator12', likes: 876, views: 6543, emoji: '☕' },
]

const typeBadge: Record<string, { label: string; color: string; border: string; textColor: string }> = {
    image: {
        label: 'Imagem',
        color: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.25)',
        textColor: '#60a5fa'
    },
    video: {
        label: 'Vídeo',
        color: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.25)',
        textColor: '#a78bfa'
    },
    audio: {
        label: 'Música',
        color: 'rgba(16,185,129,0.1)',
        border: 'rgba(16,185,129,0.25)',
        textColor: '#34d399'
    },
}

const typeGradient: Record<string, string> = {
    image: 'from-blue-950 to-indigo-950',
    video: 'from-violet-950 to-purple-950',
    audio: 'from-emerald-950 to-teal-950',
}

function TypeIcon({ type, size }: { type: string; size: number }) {
    const cls = `w-${size} h-${size}`
    if (type === 'image') return <Image className={cls} />
    if (type === 'video') return <Video className={cls} />
    return <Music className={cls} />
}

function ExploreCard({ item, index }: { item: typeof demoItems[0]; index: number }) {
    const [liked, setLiked] = useState(false)
    const badge = typeBadge[item.type]
    const gradient = typeGradient[item.type]

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
            className="masonry-item"
        >
            <div className="group relative rounded-none overflow-hidden cursor-pointer transition-all duration-300 bg-surface border border-border hover:border-accent hover:shadow-[0_8px_32px_rgba(255,51,102,0.06)]"
            >
                {/* Visual area */}
                <div className={`relative ${item.tall ? 'h-60' : 'h-40'} bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <span className="text-5xl drop-shadow-lg">{item.emoji}</span>

                    <div className="absolute top-2.5 left-2.5">
                        <span
                            className="flex items-center gap-1.5 px-2 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                            style={{
                                background: badge.color,
                                border: `1px solid ${badge.border}`,
                                color: badge.textColor,
                            }}
                        >
                            <TypeIcon type={item.type} size={3} />
                            {badge.label}
                        </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                        <button className="p-2.5 rounded-none transition-all bg-white/10 border border-white/15 hover:bg-white/20">
                            <Eye className="w-4 h-4 text-white" />
                        </button>
                        <button className="p-2.5 rounded-none transition-all bg-white/10 border border-white/15 hover:bg-white/20">
                            <Download className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                    <p className="text-sm leading-relaxed mb-3 line-clamp-2 text-text-secondary">{item.prompt}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">@{item.author}</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLiked(!liked)}
                                className={`flex items-center gap-1.5 text-xs transition-colors hover:text-accent ${liked ? 'text-accent' : 'text-text-muted'}`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                                <span>{item.likes + (liked ? 1 : 0)}</span>
                            </button>
                            <span className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Eye className="w-3.5 h-3.5" />
                                {item.views.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.article>
    )
}

export default function ExplorePage() {
    const [activeFilter, setActiveFilter] = useState('all')
    const [search, setSearch] = useState('')

    const filtered = demoItems
        .filter(item => {
            if (activeFilter === 'image') return item.type === 'image'
            if (activeFilter === 'video') return item.type === 'video'
            if (activeFilter === 'audio') return item.type === 'audio'
            return true
        })
        .filter(item => !search || item.prompt.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-background/90 backdrop-blur-md border-b border-border">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight font-heading">Explorar</h1>
                        <p className="text-xs mt-0.5 font-medium uppercase tracking-widest text-text-muted font-heading">Inspiração da comunidade global</p>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar criações..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-none text-sm outline-none transition-all bg-white/5 border border-border text-white focus:border-accent focus:bg-accent/5 focus:shadow-[0_0_0_3px_rgba(255,51,102,0.1)]"
                        />
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all font-heading border ${activeFilter === f.id
                                ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(255,51,102,0.15)]'
                                : 'bg-surface border-border text-text-muted hover:text-white hover:border-text-secondary'
                                }`}
                        >
                            <f.icon className="w-3.5 h-3.5" />
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-16 h-16 rounded-none flex items-center justify-center mb-4 bg-surface border border-border">
                                <Search className="w-7 h-7 text-text-muted" />
                            </div>
                            <p className="text-white font-semibold mb-1 font-heading">Nenhum resultado encontrado</p>
                            <p className="text-sm text-text-muted">Tente outro filtro ou termo de busca</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="masonry-grid"
                        >
                            {filtered.map((item, idx) => (
                                <ExploreCard key={item.id} item={item} index={idx} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
