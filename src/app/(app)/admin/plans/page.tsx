'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    credits: number;
    stripe_price_id: string;
    is_popular: boolean;
    features: string[];
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const [saving, setSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Form State
    const [formState, setFormState] = useState<Partial<SubscriptionPlan>>({})

    const fetchPlans = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/plans')
            if (!res.ok) throw new Error('Falha ao carregar planos')
            const data = await res.json()
            setPlans(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error('Erro ao carregar planos.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const openEditModal = (plan?: SubscriptionPlan) => {
        if (plan) {
            setSelectedPlan(plan)
            setFormState({ ...plan })
        } else {
            setSelectedPlan({ id: '' } as SubscriptionPlan) // Marker for "New Plan"
            setFormState({
                name: '',
                description: '',
                price: 0,
                credits: 0,
                stripe_price_id: '',
                is_popular: false,
                features: ['']
            })
        }
    }

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(formState.features || [])]
        newFeatures[index] = value
        setFormState({ ...formState, features: newFeatures })
    }

    const addFeature = () => {
        setFormState({ ...formState, features: [...(formState.features || []), ''] })
    }

    const removeFeature = (index: number) => {
        const newFeatures = [...(formState.features || [])]
        newFeatures.splice(index, 1)
        setFormState({ ...formState, features: newFeatures })
    }

    const saveChanges = async () => {
        setSaving(true)
        try {
            const isNew = selectedPlan?.id === ''
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isNew ? 'CREATE' : 'UPDATE',
                    id: isNew ? undefined : selectedPlan?.id,
                    ...formState
                })
            })
            if (!res.ok) throw new Error('Falha ao salvar plano')
            toast.success(isNew ? 'Plano criado com sucesso!' : 'Plano atualizado com sucesso!')
            setSelectedPlan(null)
            fetchPlans()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const deletePlan = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
        setIsDeleting(id)
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            })
            if (!res.ok) throw new Error('Falha ao excluir plano')
            toast.success('Plano excluído!')
            fetchPlans()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-heading uppercase tracking-widest">
                            <Layers className="w-6 h-6 text-accent" />
                            Gestão de Planos & Preços
                        </h1>
                        <p className="text-xs uppercase tracking-widest text-text-muted mt-1 font-heading">
                            Configure os planos do Stripe, descrições e créditos concedidos.
                        </p>
                    </div>
                    <button
                        onClick={() => openEditModal()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black border border-primary hover:bg-transparent hover:text-primary transition-all rounded-none text-xs font-bold uppercase tracking-widest font-heading shadow-xl"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Plano
                    </button>
                </div>

                {/* Plans Grid */}
                {loading ? (
                    <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-accent w-10 h-10" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-surface border border-border group hover:border-accent transition-all p-8 flex flex-col shadow-2xl relative">
                                {plan.is_popular && (
                                    <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Popular</div>
                                )}
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-2xl font-mono text-accent mt-2">${plan.price}<span className="text-xs text-text-muted">/mo</span></p>
                                </div>
                                <div className="space-y-4 mb-8 flex-grow">
                                    <div className="bg-background border border-border p-4 rounded-none">
                                        <p className="text-[10px] uppercase font-bold text-text-muted mb-1 font-heading">Créditos p/ Assinatura</p>
                                        <p className="text-lg font-mono text-white font-bold">{plan.credits}</p>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2">{plan.description}</p>
                                    <p className="text-[10px] uppercase font-bold text-text-muted mt-4 font-heading">{plan.features.length} Funcionalidades listadas</p>
                                </div>
                                <div className="flex gap-3 border-t border-border pt-6">
                                    <button
                                        onClick={() => openEditModal(plan)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-border rounded-none text-[10px] uppercase font-bold tracking-widest text-white hover:bg-white/5 transition-all"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deletePlan(plan.id)}
                                        disabled={isDeleting === plan.id}
                                        className="px-4 py-2 border border-red-500/30 rounded-none text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Edit/Create Plan */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-surface border border-border w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden shadow-edge"
                    >
                        <div className="p-8 border-b border-border bg-surface-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-heading">
                                {selectedPlan.id === '' ? 'Criar Novo Plano' : `Editar Plano: ${selectedPlan.name}`}
                            </h2>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-background">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Nome do Plano</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Pro Plan"
                                        value={formState.name}
                                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                        className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Preço Mensal (USD)</label>
                                    <input
                                        type="number"
                                        value={formState.price}
                                        onChange={(e) => setFormState({ ...formState, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-surface border border-border px-4 py-3 text-white font-mono focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Créditos Concedidos</label>
                                    <input
                                        type="number"
                                        value={formState.credits}
                                        onChange={(e) => setFormState({ ...formState, credits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-surface border border-border px-4 py-3 text-white font-mono focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Opções</label>
                                    <button
                                        onClick={() => setFormState({ ...formState, is_popular: !formState.is_popular })}
                                        className={`w-full py-3.5 px-4 flex items-center justify-between border transition-all ${formState.is_popular ? 'border-accent bg-accent/10' : 'border-border grayscale opacity-50'}`}
                                    >
                                        <span className={`text-xs uppercase font-bold tracking-widest ${formState.is_popular ? 'text-accent' : 'text-text-muted'}`}>Marcar como Popular</span>
                                        <div className={`w-4 h-4 border ${formState.is_popular ? 'bg-accent border-accent' : 'border-border bg-transparent'}`} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Stripe Price ID</label>
                                <input
                                    type="text"
                                    placeholder="price_1Hh2..."
                                    value={formState.stripe_price_id}
                                    onChange={(e) => setFormState({ ...formState, stripe_price_id: e.target.value })}
                                    className="w-full bg-surface border border-border px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                                />
                                <p className="text-[10px] text-text-muted mt-2">Cole aqui o ID do preço criado no dashboard do Stripe.</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Descrição Curta</label>
                                <textarea
                                    rows={2}
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                    className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-heading">Funcionalidades (Features)</label>
                                    <button onClick={addFeature} className="text-[10px] text-accent font-bold uppercase tracking-widest hover:underline">+ Adicionar Linha</button>
                                </div>
                                <div className="space-y-2">
                                    {formState.features?.map((f, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={f}
                                                onChange={(e) => handleFeatureChange(i, e.target.value)}
                                                className="flex-1 bg-surface border border-border px-4 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                                            />
                                            <button onClick={() => removeFeature(i)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-surface-2 flex justify-end gap-3 shadow-top">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary text-black border border-primary hover:bg-transparent hover:text-primary transition-all text-xs font-bold uppercase tracking-widest shadow-xl disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Salvar Plano
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
