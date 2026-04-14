'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Video, Image, Music, TrendingUp, Clock, Star, Flame } from 'lucide-react'
import { ImageGallery } from '@/components/ui/image-gallery'
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
    { id: '1', type: 'image', prompt: 'Cyberpunk city at sunset, neon lights reflecting on wet streets', author: 'creator1', likes: 342, views: 2109, emoji: '' },
    { id: '2', type: 'video', prompt: 'Eagle soaring over mountain peaks, slow motion', author: 'creator2', likes: 891, views: 5432, emoji: '', tall: true },
    { id: '3', type: 'image', prompt: 'Abstract fluid art in deep purple and gold', author: 'creator3', likes: 234, views: 1876, emoji: '' },
    { id: '4', type: 'audio', prompt: 'Jazz piano trio late night session', author: 'creator4', likes: 156, views: 873, emoji: '' },
    { id: '5', type: 'image', prompt: 'Magical enchanted forest with glowing mushrooms and fireflies', author: 'creator5', likes: 567, views: 3201, emoji: '', tall: true },
    { id: '6', type: 'video', prompt: 'Ocean waves crashing on rocky cliffs at golden hour', author: 'creator6', likes: 423, views: 2654, emoji: '' },
    { id: '7', type: 'image', prompt: 'Portrait of an astronaut in vintage spacesuit on Mars', author: 'creator7', likes: 789, views: 4321, emoji: '‍' },
    { id: '8', type: 'audio', prompt: 'Epic orchestral battle theme with choir', author: 'creator8', likes: 312, views: 1987, emoji: '' },
    { id: '9', type: 'image', prompt: 'Futuristic Tokyo street food market at night', author: 'creator9', likes: 445, views: 2876, emoji: '', tall: true },
    { id: '10', type: 'video', prompt: 'Time lapse of Northern Lights dancing across the sky', author: 'creator10', likes: 1234, views: 8765, emoji: '' },
    { id: '11', type: 'image', prompt: 'Realistic oil painting of a pirate ship in stormy seas', author: 'creator11', likes: 298, views: 1654, emoji: '' },
    { id: '12', type: 'audio', prompt: 'Chill lo-fi beats with rain sounds and smooth piano', author: 'creator12', likes: 876, views: 6543, emoji: '' },
]

// Cleaned unused variables

// Removed ExploreCard component as it is replaced by ImageGallery from ui components

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
                            className="w-full pl-9 pr-4 py-2.5 rounded-3xl text-sm outline-none transition-all bg-white/5 border border-border text-white focus:border-accent focus:bg-accent/5 focus:shadow-[0_0_0_3px_rgba(255,51,102,0.1)]"
                        />
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-3xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all font-heading border ${activeFilter === f.id
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
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 bg-surface border border-border">
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
                        >
                            <ImageGallery items={filtered} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
