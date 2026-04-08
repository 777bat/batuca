'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner' // Ensure toast is imported
import { Image, Video, Music, Download, Trash2, Eye, Grid, List, Clock, Zap, Loader2, Search, Filter, Sparkles } from 'lucide-react'
import WaveformPlayer from '@/components/WaveformPlayer'
import { createClient } from '@/lib/supabase/client'

interface Asset {
    id: string
    type: 'image' | 'video' | 'audio'
    prompt: string
    title: string
    createdAt: string
    credits: number
    status: 'done' | 'processing' | 'error'
    url?: string
    imageUrl?: string
}

const typeIcon = { image: Image, video: Video, audio: Music }
const typeColor = { image: 'text-blue-400', video: 'text-accent', audio: 'text-emerald-400' }
const typeBg = { image: 'from-accent/20 to-transparent', video: 'from-accent/20 to-transparent', audio: 'from-accent/20 to-transparent' }

export default function AssetsPage() {
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true)
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                setUserId(user.id)
                const res = await fetch('/api/assets')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setAssets(data)
                }
            } catch (err) {
                console.error("Failed to load assets", err)
            } finally {
                setLoading(false)
            }
        }
        fetchAssets()
    }, [])

    const filtered = assets.filter(a => {
        const matchesType = typeFilter === 'all' || a.type === typeFilter
        const matchesSearch = a.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    const deleteAsset = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        
        if (!userId) {
            toast.error('Erro', { description: 'Usuário não autenticado.' });
            return;
        }

        try {
            const result = await fetch(`/api/assets?id=${id}`, {
                method: 'DELETE'
            });

            if (result.ok) {
                setAssets(prev => prev.filter(a => a.id !== id))
                if (selectedAsset?.id === id) setSelectedAsset(null);
                toast.success('Excluído', { description: 'Mídia removida com sucesso.' })
            } else {
                toast.error('Erro', { description: 'Falha ao excluir a mídia.' })
            }
        } catch (error) {
            console.error('Delete error', error);
            toast.error('Erro', { description: 'Ocorreu um erro ao excluir.' })
        }
    }

    const totalCreditsUsed = assets.reduce((sum, a) => sum + (a.credits || 0), 0)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }

    return (
        <div className="min-h-screen bg-surface text-white overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4 max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold">Meus Assets</h1>
                        <p className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-accent" /> {assets.length} criações</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{totalCreditsUsed} créditos usados</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar nos prompts..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-[#555568] focus:outline-none focus:border-accent/50 w-64 transition-all"
                            />
                        </div>

                        <div className="w-px h-6 bg-border" />

                        {/* View toggle */}
                        <div className="flex bg-surface-2 border border-border rounded-xl p-1">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Filters and Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {['all', 'image', 'video', 'audio'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${typeFilter === t
                                    ? 'bg-accent/10 border-violet-500 text-accent shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                    : 'bg-surface-2 border-border text-text-secondary hover:border-border hover:text-white'
                                    }`}
                            >
                                {t === 'all' ? <Filter className="w-3.5 h-3.5" /> : null}
                                {t === 'image' ? <Image className="w-3.5 h-3.5" /> : null}
                                {t === 'video' ? <Video className="w-3.5 h-3.5" /> : null}
                                {t === 'audio' ? <Music className="w-3.5 h-3.5" /> : null}
                                {t === 'all' ? 'Todos' : t === 'image' ? 'Imagens' : t === 'video' ? 'Vídeos' : 'Músicas'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        {[
                            { label: 'Imagens', count: assets.filter(a => a.type === 'image').length, color: 'text-blue-400' },
                            { label: 'Vídeos', count: assets.filter(a => a.type === 'video').length, color: 'text-accent' },
                            { label: 'Músicas', count: assets.filter(a => a.type === 'audio').length, color: 'text-emerald-400' },
                        ].map(stat => (
                            <div key={stat.label} className="text-right">
                                <p className={`text-lg font-bold leading-none ${stat.color}`}>{stat.count}</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-text-muted">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                        <p className="font-medium animate-pulse">Carregando sua biblioteca...</p>
                    </div>
                ) : (
                    <>
                        {/* Grid view */}
                        {view === 'grid' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((asset, i) => (
                                        <motion.div
                                            key={asset.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => asset.status === 'done' && setSelectedAsset(asset)}
                                            className={`group relative bg-surface-2 border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-all flex flex-col ${asset.status === 'done' ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className={`aspect-square bg-gradient-to-br ${typeBg[asset.type]} flex items-center justify-center relative overflow-hidden`}>
                                                {asset.imageUrl ? (
                                                    <img src={asset.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                                        {asset.type === 'audio' && <Music className="w-12 h-12 text-emerald-500/40" />}
                                                        {asset.type === 'video' && <Video className="w-12 h-12 text-accent/40" />}
                                                        {asset.type === 'image' && <Image className="w-12 h-12 text-blue-500/40" />}
                                                    </div>
                                                )}

                                                <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${typeColor[asset.type].replace('text', 'bg')}`} />
                                                    {asset.type}
                                                </div>

                                                {asset.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                                            <p className="text-xs font-bold text-accent uppercase tracking-widest">Processando</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {asset.status === 'done' && (
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <div className="p-3 rounded-xl bg-accent text-white shadow-xl shadow-accent/20 transform scale-90 group-hover:scale-100 transition-all font-bold text-xs uppercase tracking-widest">
                                                            Visualizar
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-accent transition-colors uppercase tracking-tight">{asset.title}</h3>
                                                    <p className="text-xs text-text-muted line-clamp-2 mt-1 italic">&quot;{asset.prompt}&quot;</p>
                                                </div>
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                                    <span className="text-[10px] font-bold text-text-muted flex items-center gap-1 uppercase">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(asset.createdAt)}
                                                    </span>
                                                    <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[10px] font-bold text-accent flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        {asset.credits}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* List view */}
                        {view === 'list' && (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((asset, i) => {
                                        const Icon = typeIcon[asset.type]
                                        const color = typeColor[asset.type]
                                        return (
                                            <motion.div
                                                key={asset.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                onClick={() => asset.status === 'done' && setSelectedAsset(asset)}
                                                className={`group bg-surface-2 border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-accent/30 transition-all ${asset.status === 'done' ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate">{asset.title}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-xs text-text-muted truncate italic flex-1 max-w-md">&quot;{asset.prompt}&quot;</p>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase whitespace-nowrap">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(asset.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="hidden lg:flex px-2 py-1 bg-surface-3 rounded-lg text-[10px] font-bold text-accent gap-1.5 border border-border">
                                                        <Zap className="w-3 h-3" />
                                                        {asset.credits} CRÉDITOS
                                                    </div>

                                                    {asset.status === 'processing' ? (
                                                        <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Gerando
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <div className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold uppercase tracking-wider">
                                                                Abrir Player
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-border flex items-center justify-center mb-6 shadow-2xl">
                                    <Search className="w-10 h-10 text-[#2a2a3a]" />
                                </div>
                                <p className="text-white font-bold text-lg uppercase tracking-tight">Vazio por aqui</p>
                                <p className="text-text-muted text-sm mt-1 max-w-xs mx-auto">Nenhum asset encontrado para o seu filtro atual. Comece a criar para preencher sua biblioteca!</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Media Modal */}
            <AnimatePresence>
                {selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAsset(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-3xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Modal Actions */}
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <button
                                    onClick={(e) => deleteAsset(selectedAsset.id, e as any)}
                                    className="p-2 bg-red-500/80 hover:bg-red-500/100 rounded-full text-white transition-colors flex items-center justify-center"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors"
                                    title="Fechar"
                                >
                                    <Trash2 className="w-5 h-5 rotate-45" /> {/* Using Trash2 rotated as a big X/Close */}
                                </button>
                            </div>

                            {/* Media content */}
                            <div className="p-6">
                                <div className={`w-full ${selectedAsset.type === 'audio' ? 'mb-4' : 'aspect-video rounded-2xl overflow-hidden bg-black mb-6'}`}>
                                    {selectedAsset.type === 'audio' ? (
                                        <div className="space-y-4">
                                            <div className="aspect-square w-48 h-48 mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20 relative group">
                                                {selectedAsset.imageUrl ? (
                                                    <img src={selectedAsset.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="w-20 h-20 text-emerald-500/30" />
                                                )}
                                                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                                            </div>
                                            {selectedAsset.url && (
                                                <div className="max-w-md mx-auto">
                                                    <WaveformPlayer url={selectedAsset.url} />
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedAsset.type === 'video' ? (
                                        <video src={selectedAsset.url} controls autoPlay loop className="w-full h-full object-contain" />
                                    ) : (
                                        <img src={selectedAsset.url || selectedAsset.imageUrl} alt="" className="w-full h-full object-contain" />
                                    )}
                                </div>

                                {/* Metadata */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${typeColor[selectedAsset.type].replace('text', 'border')}/20 ${typeColor[selectedAsset.type]} bg-white/5`}>
                                                    {selectedAsset.type}
                                                </span>
                                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{formatDate(selectedAsset.createdAt)}</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-white uppercase tracking-tight leading-tight">{selectedAsset.title}</h2>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedAsset.url && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(selectedAsset.url!)
                                                            const blob = await res.blob()
                                                            const blobUrl = URL.createObjectURL(blob)
                                                            const a = document.createElement('a')
                                                            a.href = blobUrl
                                                            const ext = selectedAsset.type === 'audio' ? 'mp3' : selectedAsset.type === 'video' ? 'mp4' : 'png'
                                                            a.download = `${selectedAsset.title || 'asset'}.${ext}`
                                                            document.body.appendChild(a)
                                                            a.click()
                                                            document.body.removeChild(a)
                                                            URL.revokeObjectURL(blobUrl)
                                                        } catch {
                                                            window.open(selectedAsset.url!, '_blank')
                                                        }
                                                    }}
                                                    className="p-3 bg-accent hover:bg-accent text-white rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2 text-sm font-bold"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-surface-3 border border-border rounded-2xl p-4">
                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-accent" />
                                            Prompt Original
                                        </p>
                                        <p className="text-sm text-text-secondary leading-relaxed italic">&quot;{selectedAsset.prompt}&quot;</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
