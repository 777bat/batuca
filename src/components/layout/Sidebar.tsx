'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Compass, Wand2, FolderOpen, Settings, LogOut,
    Zap, CreditCard, ChevronLeft, ChevronRight, Image, Video, Music,
    Cpu, Users, Menu, X, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const navItems = [
    { icon: Compass, label: 'Explorar', href: '/explore' },
    { icon: Wand2, label: 'Criar', href: '/generate' },
    { icon: FolderOpen, label: 'Meus Assets', href: '/assets' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
]

const tools = [
    { icon: Image, label: 'Imagem', href: '/generate?tab=image', accent: '#60a5fa' },
    { icon: Video, label: 'Vídeo', href: '/generate?tab=video', accent: '#a78bfa' },
    { icon: Music, label: 'Música', href: '/generate?tab=audio', accent: '#34d399' },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [credits, setCredits] = useState<number | null>(null)
    const [role, setRole] = useState<string>('user')
    const [appSettings, setAppSettings] = useState<{ [key: string]: boolean }>({
        tool_image_active: true,
        tool_video_active: true,
        tool_music_active: true,
    })

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Busca configurações globais
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('app_settings').select('key, value')
            if (data) {
                const newSettings: any = {}
                data.forEach((item: any) => {
                    newSettings[item.key] = item.value === 'true' || item.value === true
                })
                setAppSettings(prev => ({ ...prev, ...newSettings }))
            }
        }
        fetchSettings()
    }, [supabase])

    useEffect(() => {
        const fetchCredits = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                try {
                    const res = await fetch('/api/user/credits')
                    const data = await res.json()
                    if (typeof data.credits === 'number') setCredits(data.credits)
                    if (data.role) setRole(data.role)
                } catch (err) {
                    console.error('Failed to fetch credits in sidebar:', err)
                }
            }
        }

        fetchCredits()
        const intervalId = setInterval(fetchCredits, 15000)
        return () => clearInterval(intervalId)
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-40 flex items-center justify-between px-4" style={{ background: '#0A0A0A' }}>
                <Link href="/" className="flex items-center gap-3 px-2">
                    <img src="/logo.png" alt="batuca.ia" width={110} height={32} className="object-contain" />
                </Link>
                <button onClick={() => setMobileOpen(true)} className="p-2 text-text-secondary hover:text-white">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? 64 : 232 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    background: 'var(--color-surface)',
                    borderRight: '1px solid var(--color-border)',
                }}
            >
            {/* Logo */}
            <div className="h-[64px] flex items-center px-4 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Link href="/" className="flex items-center min-w-0 group h-full">
                    <AnimatePresence>
                        {!collapsed ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full flex justify-center items-center"
                            >
                                <img src="/logo.png" alt="batuca.ia" className="h-8 w-auto object-contain" />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full flex justify-center items-center overflow-hidden"
                            >
                                <img src="/logo.png" alt="batuca.ia" className="h-8 w-auto object-contain object-left max-w-[32px]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Credits pill */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pt-3 pb-1 overflow-hidden"
                    >
                        <div className="px-3 py-2.5 flex items-center gap-3 border border-border">
                            <div className="p-1.5 flex-shrink-0 bg-accent/10">
                                <Zap className="w-3.5 h-3.5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                                    style={{ color: '#555' }}>Créditos</p>
                                <p className="text-sm font-bold text-white">
                                    {credits !== null ? credits.toLocaleString('pt-BR') : '…'}
                                </p>
                            </div>
                            <Link href="/settings" title="Ver planos"
                                className="p-1.5 transition-colors text-muted hover:text-accent">
                                <CreditCard className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
                {navItems.map(item => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative ${isActive ? 'bg-surface-2 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-primary'}`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-accent" />
                            )}

                            <item.icon
                                className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
                                style={{ color: isActive ? 'var(--color-accent)' : undefined }}
                            />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm font-semibold truncate"
                                        style={{ color: isActive ? 'white' : 'inherit' }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}

                {/* Quick tools */}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pt-5 pb-1"
                        >
                            <p className="section-label px-3 mb-2">Ferramentas</p>
                            {tools.filter(tool => {
                                if (tool.label === 'Imagem') return appSettings.tool_image_active;
                                if (tool.label === 'Vídeo') return appSettings.tool_video_active;
                                if (tool.label === 'Música') return appSettings.tool_music_active;
                                return true;
                            }).map(tool => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="flex items-center gap-3 px-3 py-2 transition-all group text-text-secondary hover:bg-surface-2 hover:text-primary"
                                >
                                    <tool.icon className="w-4 h-4 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                        style={{ color: tool.accent }} />
                                    <span className="text-sm font-medium truncate">{tool.label}</span>
                                </Link>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Admin Navigation */}
                <AnimatePresence>
                    {!collapsed && role === 'admin' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pt-5 pb-1"
                        >
                            <p className="section-label px-3 mb-2" style={{ color: '#ef4444' }}>Administração</p>
                            <Link
                                href="/admin/users"
                                className={`flex items-center gap-3 px-3 py-2 transition-all ${pathname === '/admin/users' ? 'bg-surface-2 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-primary'}`}
                            >
                                <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444', opacity: 0.8 }} />
                                <span className="text-sm font-medium truncate">Usuários</span>
                            </Link>
                            <Link
                                href="/admin/plans"
                                className={`flex items-center gap-3 px-3 py-2 transition-all ${pathname === '/admin/plans' ? 'bg-surface-2 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-primary'}`}
                            >
                                <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: '#60a5fa', opacity: 0.8 }} />
                                <span className="text-sm font-medium truncate">Planos & Preços</span>
                            </Link>
                            <Link
                                href="/admin/models"
                                className={`flex items-center gap-3 px-3 py-2 transition-all ${pathname === '/admin/models' ? 'bg-surface-2 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-primary'}`}
                            >
                                <Cpu className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399', opacity: 0.8 }} />
                                <span className="text-sm font-medium truncate">Modelos IA</span>
                            </Link>
                            <Link
                                href="/admin/settings"
                                className={`flex items-center gap-3 px-3 py-2 transition-all ${pathname === '/admin/settings' ? 'bg-surface-2 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-primary'}`}
                            >
                                <Settings className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa', opacity: 0.8 }} />
                                <span className="text-sm font-medium truncate">Ferramentas</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Collapse button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="mx-2 mb-2 p-2.5 transition-all flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text-secondary"
            >
                {collapsed
                    ? <ChevronRight className="w-4 h-4" />
                    : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Logout */}
            <div className="p-2 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all font-medium text-text-muted hover:bg-accent/10 hover:text-accent"
                    title={collapsed ? 'Sair' : undefined}
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm"
                            >
                                Sair
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
        </>
    )
}
