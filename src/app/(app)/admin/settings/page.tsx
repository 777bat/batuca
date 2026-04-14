'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Settings, ShieldCheck, Image as ImageIcon, Video, Music, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface AppSetting {
    key: string
    value: boolean
}

export default function AdminSettingsPage() {
    const supabase = createClient()
    const [settings, setSettings] = useState<AppSetting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('app_settings').select('*')
            if (error) throw error

            if (data) {
                // Converta de JSONB para boolean
                const parsedSettings = data.map((item: any) => ({
                    key: item.key,
                    value: item.value === 'true' || item.value === true
                }))
                setSettings(parsedSettings)
            }
        } catch (err: any) {
            console.error(err)
            toast.error('Erro ao carregar configurações.')
        } finally {
            setLoading(false)
        }
    }

    const toggleSetting = (key: string) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: !s.value } : s))
    }

    const saveSettings = async () => {
        setSaving(true)
        try {
            for (const setting of settings) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({ key: setting.key, value: setting.value, updated_at: new Date().toISOString() })
                
                if (error) throw error
            }

            toast.success('Configurações salvas com sucesso!')
        } catch (err: any) {
            console.error(err)
            toast.error('Ocorreu um erro ao salvar as configurações.')
        } finally {
            setSaving(false)
        }
    }

    const tools = [
        { id: 'tool_image_active', name: 'Geração de Imagens', text: 'Ativa a ferramenta de geração visual via DALL-E/Flux.', icon: ImageIcon },
        { id: 'tool_video_active', name: 'Geração de Vídeos', text: 'Permite criar animações e vídeos a partir de fotos.', icon: Video },
        { id: 'tool_music_active', name: 'Geração de Música', text: 'Habilita a criação de faixas musicais com IA.', icon: Music },
    ]

    const getSettingValue = (key: string) => {
        const item = settings.find(s => s.key === key)
        return item ? item.value : false // default false se nao achar
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
            <div>
                <h1 className="text-3xl font-bold font-heading uppercase tracking-widest flex items-center gap-3 text-white">
                    <Settings className="w-8 h-8 text-accent" />
                    Gerenciamento Geral
                </h1>
                <p className="text-text-muted mt-2 font-heading tracking-widest text-sm uppercase">Ative ou desative ferramentas da plataforma para todos os usuários.</p>
            </div>

            <div className="bg-surface border border-border p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2 font-heading">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Controle de  Ferramentas
                </h2>

                <div className="space-y-4">
                    {tools.map((tool) => {
                        const Icon = tool.icon
                        const isActive = getSettingValue(tool.id)

                        return (
                            <div key={tool.id} className={`flex items-center justify-between p-4 border transition-colors ${isActive ? 'bg-accent/5 border-accent/20' : 'bg-background border-white/5'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-3xl flex items-center justify-center border ${isActive ? 'bg-accent text-background border-accent' : 'bg-surface text-text-muted border-white/5'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wide font-heading">{tool.name}</h3>
                                        <p className="text-xs text-text-secondary mt-1">{tool.text}</p>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => toggleSetting(tool.id)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-accent' : 'bg-surface border border-white/10'}`}
                                >
                                    <span className="sr-only">Habilitar {tool.name}</span>
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="bg-primary hover:bg-transparent text-background hover:text-primary font-bold uppercase tracking-widest text-xs py-3 px-8 flex items-center justify-center gap-2 transition-all border border-primary disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    )
}
