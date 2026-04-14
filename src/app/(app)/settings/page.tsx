'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, CreditCard, Save, RefreshCw, Zap, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    credits: number;
    subscription_tier: string;
    created_at: string;
}

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    credits: number;
    is_popular: boolean;
    features: string[];
}

export default function SettingsPage() {
    const supabase = createClient()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [checkingOut, setCheckingOut] = useState<string | null>(null)
    const router = useRouter()

    // Form inputs
    const [fullName, setFullName] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            // Busca Perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)
            setFullName(profileData.full_name || '')

            // Busca Planos Ativos
            // Busca Planos Ativos direto do banco
            const { data: plansData, error: plansError } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true })

            if (!plansError && plansData) {
                setPlans(plansData)
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar dados da conta.')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', profile.id)

            if (error) throw error
            toast.success('Perfil atualizado com sucesso!')
            setProfile({ ...profile, full_name: fullName })
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar perfil.')
        } finally {
            setSaving(false)
        }
    }

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        setCheckingOut(plan.id)
        router.push(`/checkout/${plan.id}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 text-accent animate-spin" />
            </div>
        )
    }

    if (!profile) return null;

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background text-white">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-heading uppercase tracking-widest flex items-center gap-3">
                        <Settings className="w-8 h-8 text-accent" />
                        Configurações da Conta
                    </h1>
                    <p className="text-text-muted mt-2 font-heading tracking-widest text-sm uppercase">Gerencie seu perfil, créditos e assinatura ativa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column - Profile & Info */}
                    <div className="md:col-span-1 space-y-8">
                        {/* Status Card */}
                        <div className="bg-surface border border-border p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 font-heading">Status da Conta</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] uppercase text-text-secondary tracking-widest mb-1">Seu Plano</p>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-accent" />
                                        <span className="font-bold text-lg uppercase tracking-tight text-white">{profile.subscription_tier}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-text-secondary tracking-widest mb-1">Créditos Restantes</p>
                                    <span className="font-mono text-2xl text-accent font-bold">{profile.credits}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-text-secondary tracking-widest mb-1">Membro desde</p>
                                    <span className="font-mono text-sm text-white">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Settings */}
                        <div className="bg-surface border border-border p-6 shadow-xl space-y-4">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-heading flex items-center gap-2">
                                <User className="w-4 h-4" /> Dados Pessoais
                            </h2>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">Email (Somente leitura)</label>
                                <input 
                                    type="email" 
                                    disabled 
                                    value={profile.email}
                                    className="w-full bg-background border border-border px-3 py-2 text-sm text-text-muted cursor-not-allowed font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-background border border-border px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                                    placeholder="Como quer ser chamado?"
                                />
                            </div>

                            <button 
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold text-[10px] uppercase tracking-widest py-3 hover:bg-transparent hover:text-primary transition-colors border border-primary disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Billing & Plans */}
                    <div className="md:col-span-2">
                        <div className="bg-surface border border-border p-8 shadow-xl">
                            <h2 className="text-xl font-bold uppercase tracking-widest font-heading mb-6 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-accent" /> Upgrade de Plano
                            </h2>
                            <p className="text-sm text-text-secondary mb-8">
                                Você está atualmente no plano <strong className="text-white uppercase px-2 bg-accent/10 border border-accent/20 rounded-3xl py-0.5">{profile.subscription_tier}</strong>.
                                Para desbloquear mais créditos e funcionalidades premium, escolha uma das opções abaixo:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={`border p-6 relative flex flex-col transition-all duration-300 ${plan.is_popular ? 'border-accent bg-accent/5' : 'border-border bg-background hover:border-accent/50'}`}>
                                        {plan.is_popular && (
                                            <div className="absolute top-0 right-0 bg-accent text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 transform translate-x-1 -translate-y-1/2">
                                                Mais Popular
                                            </div>
                                        )}
                                        
                                        <h3 className="text-lg font-bold font-heading uppercase tracking-wide mb-1">{plan.name}</h3>
                                        <div className="mb-4">
                                            <span className="text-3xl font-mono text-white">R$ {plan.price.toFixed(2)}</span>
                                            <span className="text-xs text-text-muted">/mês</span>
                                        </div>
                                        
                                        <div className="bg-surface p-3 border border-border mb-4 text-center">
                                            <span className="text-sm font-bold text-accent"> {plan.credits} Créditos mensais</span>
                                        </div>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                                                    <CheckCircle2 className="w-4 h-4 text-accent/70 shrink-0" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button 
                                            onClick={() => handleSubscribe(plan)}
                                            disabled={checkingOut === plan.id || profile.subscription_tier.toLowerCase() === plan.name.toLowerCase()}
                                            className="w-full py-3 bg-white text-black font-bold uppercase text-[10px] tracking-widest hover:bg-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {checkingOut === plan.id ? (
                                                <RefreshCw className="w-4 h-4 mx-auto animate-spin" />
                                            ) : profile.subscription_tier.toLowerCase() === plan.name.toLowerCase() ? (
                                                'Plano Atual'
                                            ) : (
                                                'Assinar ' + plan.name
                                            )}
                                        </button>
                                    </div>
                                ))}

                                {plans.length === 0 && (
                                    <div className="col-span-full text-center py-10 bg-background border border-border border-dashed">
                                        <p className="text-text-muted text-sm uppercase tracking-widest font-heading">Nenhum plano cadastrado no sistema no momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
