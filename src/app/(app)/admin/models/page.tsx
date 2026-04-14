'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Hexagon, Search, RefreshCw, Cpu, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AIModel {
    id: string;
    model_id: string;
    name: string;
    type: 'image' | 'audio' | 'video';
    cost: number;
    is_active: boolean;
    provider: string;
}

export default function AdminModelsPage() {
    const [models, setModels] = useState<AIModel[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
    const [editCost, setEditCost] = useState<number>(0)
    const [saving, setSaving] = useState(false)

    const fetchModels = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/models')
            if (!res.ok) throw new Error('Não autorizado')
            const data = await res.json()
            setModels(data)
        } catch (err) {
            toast.error('Erro ao carregar modelos de IA.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchModels()
    }, [])

    const toggleModelStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/models', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_ACTIVE', id, payload: !currentStatus })
            });
            if (!res.ok) throw new Error('Falha ao atualizar o modelo')
            toast.success(currentStatus ? 'Modelo Desativado!' : 'Modelo Ativado!')
            fetchModels()
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const openEditModal = (model: AIModel) => {
        setSelectedModel(model)
        setEditCost(model.cost)
    }

    const saveCost = async () => {
        if (!selectedModel) return;
        setSaving(true)
        try {
            const res = await fetch('/api/admin/models', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPDATE_COST', id: selectedModel.id, payload: editCost })
            })
            if (!res.ok) throw new Error('Falha ao atualizar preço')
            toast.success('Custo atualizado!')
            setSelectedModel(null)
            fetchModels()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-heading uppercase tracking-widest">
                            <Cpu className="w-6 h-6 text-accent" />
                            Modelos de Inteligência Artificial
                        </h1>
                        <p className="text-xs text-text-muted mt-1 font-heading uppercase tracking-widest">Ligue, desligue e ajuste os preços das gerações dinamicamente.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-none p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-none pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:bg-accent/5 transition-all"
                        />
                    </div>

                    <button onClick={fetchModels} className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-white/5 border border-border hover:border-text-secondary rounded-none text-xs uppercase tracking-widest font-heading text-white transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
                        Atualizar
                    </button>
                </div>

                {/* Table Area */}
                <div className="bg-surface border border-border rounded-none overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-widest font-heading">
                                    <th className="px-6 py-4">Modelo</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4">Custo (Créditos)</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading && models.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted font-heading uppercase tracking-widest text-xs">Buscando inteligências...</td></tr>
                                ) : filteredModels.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted font-heading uppercase tracking-widest text-xs">Nenhum modelo listado.</td></tr>
                                ) : (
                                    filteredModels.map(model => (
                                        <tr key={model.id} className="hover:bg-accent/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-none border flex items-center justify-center flex-shrink-0
                                                        ${model.type === 'image' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                            model.type === 'audio' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-violet-500/10 text-violet-400 border-violet-500/30'}
                                                    `}>
                                                        <Hexagon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate font-heading">{model.name}</p>
                                                        <p className="text-[10px] text-text-muted tracking-widest uppercase font-heading mt-0.5">{model.model_id} ({model.provider})</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold font-heading">{model.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-bold text-primary bg-background px-3 py-1.5 rounded-none border border-border">
                                                     {model.cost}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleModelStatus(model.id, model.is_active)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-none transition-colors border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${model.is_active ? 'bg-accent border-accent text-white' : 'bg-transparent border-border'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-none bg-white transition-transform ${model.is_active ? 'translate-x-6 bg-white' : 'translate-x-1 bg-text-muted'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(model)}
                                                    className="p-2 hover:bg-accent/10 text-text-muted hover:text-accent rounded-none transition-colors inline-block"
                                                    title="Modificar Preço"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Cost Modal */}
            {selectedModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface border border-border rounded-none w-full max-w-sm overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-heading">Configurar Preço</h2>
                            <p className="text-[10px] uppercase tracking-widest font-heading text-text-muted mt-1">{selectedModel.name}</p>
                        </div>

                        <div className="p-6">
                            <label className="text-[10px] uppercase tracking-widest font-heading font-medium text-text-secondary block mb-2">Custo de Geração (Créditos)</label>
                            <input
                                type="number"
                                min="0"
                                value={editCost}
                                onChange={(e) => setEditCost(parseInt(e.target.value) || 0)}
                                className="w-full bg-background border border-border rounded-none px-4 py-3 text-2xl font-bold font-mono text-accent focus:outline-none focus:border-accent focus:bg-accent/5 transition-colors text-center"
                            />
                            <div className="flex items-start gap-2 mt-4 text-text-muted bg-white/5 p-3 rounded-none border border-white/5">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-50" />
                                <p className="text-[10px] uppercase tracking-widest font-heading">Essa mudança será propagada nas páginas de criação em tempo real e afetará as APIs no próximo request.</p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-background flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedModel(null)}
                                className="px-4 py-2 rounded-none text-xs uppercase tracking-widest font-heading font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-text-muted"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveCost}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 rounded-none bg-primary text-black hover:bg-transparent hover:text-primary transition-all disabled:opacity-50 border border-primary text-xs uppercase tracking-widest font-bold font-heading"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Salvar Preço
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
