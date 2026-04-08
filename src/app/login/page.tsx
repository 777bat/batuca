'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError('E-mail ou senha inválidos. Tente novamente.')
            setLoading(false)
        } else {
            router.push('/generate')
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 animated-gradient opacity-30" />
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-accent/10 blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center group">
                        <img src="/logo.png" alt="batuca.ia" className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-white mt-6 tracking-tight uppercase">Bem-vindo de volta</h1>
                    <p className="text-text-secondary text-base font-medium mt-2">Entre para continuar criando</p>
                </div>

                <div className="glass rounded-none p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-none p-4 text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-semibold text-text-secondary block mb-2 uppercase tracking-widest font-heading">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full bg-surface/50 border border-white/5 rounded-none pl-11 pr-4 py-3.5 text-white placeholder-text-muted text-sm font-medium focus:outline-none focus:border-accent/50 focus:bg-surface transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-surface/50 border border-white/5 rounded-none pl-11 pr-11 py-3.5 text-white placeholder-text-muted text-sm font-medium focus:outline-none focus:border-accent/50 focus:bg-surface transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="text-right">
                            <Link href="#" className="flex justify-end text-xs font-semibold text-text-muted hover:text-white transition-colors uppercase tracking-widest font-heading">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-transparent border border-primary hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed text-background py-4 rounded-none font-bold text-xs uppercase tracking-widest font-heading transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-none animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar na Plataforma</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs uppercase tracking-widest font-medium text-text-secondary flex flex-col gap-2 font-heading">
                        Não tem uma conta?{' '}
                        <Link href="/signup" className="text-white hover:text-accent font-bold transition-colors">
                            Criar conta grátis
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
