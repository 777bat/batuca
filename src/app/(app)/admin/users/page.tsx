'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Edit2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    credits: number;
    subscription_tier: string;
    created_at: string;
    last_sign_in_at: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal Edit State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [editCredits, setEditCredits] = useState<number>(0)
    const [editRole, setEditRole] = useState<string>('user')
    const [saving, setSaving] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('Não autorizado ou erro na API')
            const data = await res.json()
            setUsers(data)
        } catch (err) {
            toast.error('Erro ao carregar usuários.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.id.includes(searchTerm)
    )

    const openEditModal = (user: UserProfile) => {
        setSelectedUser(user)
        setEditCredits(user.credits)
        setEditRole(user.role)
    }

    const saveChanges = async () => {
        if (!selectedUser) return;
        setSaving(true)
        try {
            // Se créditos mudaram
            if (editCredits !== selectedUser.credits) {
                const resCreds = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'ALTER_CREDITS', user_id: selectedUser.id, amount: editCredits })
                })
                if (!resCreds.ok) throw new Error('Falha ao atualizar créditos')
            }

            // Se role mudou
            if (editRole !== selectedUser.role) {
                const resRole = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'ALTER_ROLE', user_id: selectedUser.id, new_role: editRole })
                })
                if (!resRole.ok) throw new Error('Falha ao atualizar cargo')
            }

            toast.success('Usuário atualizado com sucesso!')
            setSelectedUser(null)
            fetchUsers() // refresh list
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-heading uppercase tracking-widest">
                            <Users className="w-6 h-6 text-accent" />
                            Gerenciamento de Usuários
                        </h1>
                        <p className="text-xs uppercase tracking-widest text-text-muted mt-1 font-heading">Conceda créditos, altere permissões e monitore os cadastros.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-3xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por email, nome ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-3xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:bg-accent/5 transition-all"
                        />
                    </div>

                    <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-white/5 border border-border hover:border-text-secondary rounded-3xl text-xs uppercase tracking-widest font-heading text-white transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
                        Atualizar
                    </button>
                </div>

                {/* Table Area */}
                <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-widest font-heading">
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Status / Role</th>
                                    <th className="px-6 py-4">Créditos</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Membro desde</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading && users.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-text-muted font-heading uppercase tracking-widest text-xs">Carregando usuários...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-text-muted font-heading uppercase tracking-widest text-xs">Nenhum usuário encontrado.</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-accent/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-3xl bg-accent/20 text-accent border border-accent/30 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 font-heading">
                                                        {user.email.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate font-heading">{user.full_name || 'Sem Nome'}</p>
                                                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                                                        <p className="text-[10px] text-text-muted truncate font-mono mt-0.5">{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-3xl text-[10px] uppercase tracking-widest font-bold border font-heading ${user.role === 'admin'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono text-primary bg-background px-2 py-1 rounded-3xl border border-border font-bold">
                                                    {user.credits}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest font-heading">{user.subscription_tier}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-text-secondary tracking-widest font-heading">
                                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-accent/20 text-text-muted hover:text-accent rounded-3xl transition-colors inline-block"
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

            {/* Edit Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-heading">Editar Usuário</h2>
                            <p className="text-xs uppercase tracking-widest text-text-muted mt-1 font-heading">{selectedUser.email}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Saldo de Créditos</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editCredits}
                                    onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                                    className="w-full bg-background border border-border rounded-3xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:bg-accent/5 transition-colors font-mono"
                                />
                                <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-2 font-heading">Você pode dar ou remover créditos diretamente.</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-secondary block mb-2 uppercase tracking-widest font-heading">Nível de Permissão (Role)</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full bg-background border border-border rounded-3xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors font-heading text-sm"
                                >
                                    <option value="user">Usuário Padrão (user)</option>
                                    <option value="admin">Administrador (admin)</option>
                                </select>
                                {editRole === 'admin' && (
                                    <div className="flex items-start gap-2 mt-3 text-red-400 bg-red-400/10 p-3 rounded-3xl border border-red-500/30">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] uppercase font-bold tracking-widest font-heading">Aviso: Administradores têm acesso total a este painel e podem modificar saldos e gerar sem limites se implementado.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-background flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 rounded-3xl text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-colors font-heading border border-transparent hover:border-border"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 rounded-3xl bg-primary text-black hover:bg-transparent hover:text-primary border border-primary text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 font-heading"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Salvar Alterações
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
