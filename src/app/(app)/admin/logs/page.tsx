'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Search, RefreshCw, Image, Video, Music, Filter, Clock, ChevronDown, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface LogEntry {
    id: string
    user_id: string
    user_name: string
    type: 'image' | 'video' | 'audio'
    prompt: string
    title?: string
    model: string
    status: string
    cost: number
    result_url?: string
    image_url?: string
    created_at: string
}

const typeConfig = {
    image: { icon: Image, label: 'Imagem', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    video: { icon: Video, label: 'Video', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    audio: { icon: Music, label: 'Musica', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

const statusConfig: Record<string, { label: string, color: string, bg: string, border: string }> = {
    success: { label: 'Concluido', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    completed: { label: 'Concluido', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    text_success: { label: 'Concluido', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    first_success: { label: 'Concluido', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    pending: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    processing: { label: 'Processando', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    failed: { label: 'Falhou', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    error: { label: 'Erro', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [limit, setLimit] = useState(100)
    const [autoRefresh, setAutoRefresh] = useState(false)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (typeFilter !== 'all') params.set('type', typeFilter)
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (searchTerm) params.set('search', searchTerm)
            params.set('limit', String(limit))

            const res = await fetch(`/api/admin/logs?${params}`)
            if (!res.ok) throw new Error('Erro na API')
            const data = await res.json()
            setLogs(data.logs || [])
            setTotal(data.total || 0)
        } catch {
            toast.error('Erro ao carregar logs.')
        } finally {
            setLoading(false)
        }
    }, [typeFilter, statusFilter, searchTerm, limit])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)
    }, [autoRefresh, fetchLogs])

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
            ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const getStatusBadge = (status: string) => {
        const cfg = statusConfig[status.toLowerCase()] || { label: status, color: 'text-text-muted', bg: 'bg-white/5', border: 'border-border' }
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] uppercase tracking-widest font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                {cfg.label}
            </span>
        )
    }

    const getTypeBadge = (type: 'image' | 'video' | 'audio') => {
        const cfg = typeConfig[type] || typeConfig.image
        const Icon = cfg.icon
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] uppercase tracking-widest font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                <Icon className="w-3 h-3" />
                {cfg.label}
            </span>
        )
    }

    // Stats
    const stats = {
        total: logs.length,
        images: logs.filter(l => l.type === 'image').length,
        videos: logs.filter(l => l.type === 'video').length,
        audios: logs.filter(l => l.type === 'audio').length,
        totalCredits: logs.reduce((sum, l) => sum + (l.cost || 0), 0),
    }

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-heading uppercase tracking-widest">
                        <Activity className="w-6 h-6 text-accent" />
                        Logs de Geracao
                    </h1>
                    <p className="text-xs uppercase tracking-widest text-text-muted mt-1 font-heading">
                        Historico completo de geracoes de todos os usuarios
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-white' },
                        { label: 'Imagens', value: stats.images, color: 'text-blue-400' },
                        { label: 'Videos', value: stats.videos, color: 'text-purple-400' },
                        { label: 'Musicas', value: stats.audios, color: 'text-emerald-400' },
                        { label: 'Creditos Usados', value: stats.totalCredits, color: 'text-accent' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface border border-border rounded-none p-4">
                            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-none p-4 flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Buscar por prompt..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-none pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="bg-background border border-border rounded-none px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent appearance-none pr-8 cursor-pointer"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="image">Imagens</option>
                            <option value="video">Videos</option>
                            <option value="audio">Musicas</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-background border border-border rounded-none px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent appearance-none pr-8 cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="completed">Concluido</option>
                            <option value="pending">Pendente</option>
                            <option value="failed">Falhou</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>

                    {/* Auto Refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest border transition-all ${
                            autoRefresh
                                ? 'bg-accent/10 text-accent border-accent/30'
                                : 'bg-transparent text-text-muted border-border hover:text-white hover:border-white/20'
                        }`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Auto 10s' : 'Auto Off'}
                    </button>

                    {/* Manual Refresh */}
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest text-text-muted border border-border hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Table */}
                {loading && logs.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-none overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        {['Data', 'Usuario', 'Tipo', 'Modelo', 'Prompt', 'Status', 'Creditos', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest font-heading whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                                            {/* Date */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs text-text-muted flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </td>

                                            {/* User */}
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-white font-medium">{log.user_name}</span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3">
                                                {getTypeBadge(log.type)}
                                            </td>

                                            {/* Model */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-text-secondary font-mono">{log.model || '-'}</span>
                                            </td>

                                            {/* Prompt */}
                                            <td className="px-4 py-3 max-w-xs">
                                                <p className="text-xs text-text-secondary truncate" title={log.prompt}>
                                                    {log.title && log.type === 'audio'
                                                        ? <><span className="text-white font-medium">{log.title}</span> - {log.prompt.slice(0, 60)}</>
                                                        : log.prompt.slice(0, 80) || '-'
                                                    }
                                                    {log.prompt.length > 80 ? '...' : ''}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {getStatusBadge(log.status)}
                                            </td>

                                            {/* Credits */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-bold text-accent">{log.cost}</span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                {log.result_url && (
                                                    <a
                                                        href={log.result_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-text-muted hover:text-accent transition-colors"
                                                        title="Abrir resultado"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {logs.length === 0 && (
                            <div className="py-16 text-center">
                                <Activity className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                <p className="text-sm text-text-muted">Nenhum log encontrado</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Load More */}
                {logs.length >= limit && (
                    <div className="text-center">
                        <button
                            onClick={() => setLimit(prev => prev + 100)}
                            className="px-6 py-2.5 rounded-none bg-surface border border-border text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-white/20 transition-all"
                        >
                            Carregar Mais
                        </button>
                    </div>
                )}

                {/* Footer info */}
                <p className="text-[10px] text-text-muted text-center uppercase tracking-widest">
                    Exibindo {logs.length} de {total} registros
                </p>
            </div>
        </div>
    )
}
