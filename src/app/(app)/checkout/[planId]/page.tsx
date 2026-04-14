'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, QrCode, ShieldCheck, Lock, Copy, CheckCircle, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const planId = params.planId as string
    const supabase = createClient()

    const [plan, setPlan] = useState<any>(null)
    const [loadingPlan, setLoadingPlan] = useState(true)
    const [user, setUser] = useState<any>(null)

    // Form inputs
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
    const [name, setName] = useState('')
    const [cpfCnpj, setCpfCnpj] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [addressNumber, setAddressNumber] = useState('')

    // Credit Card inputs
    const [cardNumber, setCardNumber] = useState('')
    const [holderName, setHolderName] = useState('')
    const [expiry, setExpiry] = useState('')
    const [ccv, setCcv] = useState('')

    // States
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState('')

    // PIX State
    const [pixQrCode, setPixQrCode] = useState<{ encodedImage: string; payload: string } | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)
            if (user.user_metadata?.full_name) {
                setName(user.user_metadata.full_name)
            }

            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single()

            if (data && !error) {
                setPlan(data)
            }
            setLoadingPlan(false)
        }
        fetchData()
    }, [planId, router, supabase])

    const handleCopyPix = () => {
        if (!pixQrCode?.payload) return
        navigator.clipboard.writeText(pixQrCode.payload)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessing(true)
        setError('')

        try {
            const reqBody: any = {
                planId,
                paymentMethod,
                name,
                cpfCnpj: cpfCnpj.replace(/\D/g, '') // remove pontuação
            }

            if (paymentMethod === 'CREDIT_CARD') {
                const [expiryMonth, expiryYear] = expiry.split('/')
                if (!expiryMonth || !expiryYear) {
                    throw new Error('Validade do cartão deve ser no formato MM/AAAA')
                }

                reqBody.creditCard = {
                    holderName,
                    number: cardNumber.replace(/\s/g, ''),
                    expiryMonth: expiryMonth.trim(),
                    expiryYear: expiryYear.trim().length === 2 ? `20${expiryYear.trim()}` : expiryYear.trim(),
                    ccv: ccv.trim()
                }
                reqBody.address = {
                    postalCode: postalCode.replace(/\D/g, ''),
                    addressNumber: addressNumber.trim() || 'S/N'
                }
            }

            const res = await fetch('/api/checkout/transparent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento.')

            // Se for PIX
            if (paymentMethod === 'PIX' && data.paymentId) {
                // Buscar QR Code
                const qrRes = await fetch(`/api/checkout/pix-qrcode?id=${data.paymentId}`)
                const qrData = await qrRes.json()
                if (!qrRes.ok) throw new Error(qrData.error || 'Erro ao gerar QR Code.')
                setPixQrCode(qrData)
                setProcessing(false)
                return
            }

            if (paymentMethod === 'CREDIT_CARD') {
                // Cartão aprovado ou pendente
                if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
                    // Já pode exibir sucesso direto
                    router.push('/settings?success=true')
                } else if (data.status === 'PENDING') {
                    setError('O pagamento está sendo analisado. Verifique os créditos em instantes.')
                } else {
                    setError(`Pagamento recusado ou falhou. Status Asaas: ${data.status}`)
                }
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setProcessing(false)
        }
    }

    if (loadingPlan) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
    if (!plan) return <div className="p-8 text-red-400">Plano não encontrado.</div>

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 md:px-8">
            <Link href="/settings" className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-8 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ESQUERDA: Formulário */}
                <div className="lg:col-span-7 space-y-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-white mb-2">Finalizar Assinatura</h1>
                        <p className="text-text-secondary">Conclua o pagamento de forma segura em ambiente 100% criptografado através da API do Asaas.</p>
                    </div>

                    {pixQrCode ? (
                        <div className="glass p-8 text-center space-y-6 border border-accent/20 bg-accent/5">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 mb-2">
                                <QrCode className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Escaneie o QR Code PIX</h3>
                            <p className="text-text-secondary">Seus créditos serão liberados em menos de 10 segundos após o pagamento.</p>

                            <img src={`data:image/png;base64,${pixQrCode.encodedImage}`} alt="QR Code PIX" className="w-56 h-56 mx-auto rounded-3xl border border-white/10" />

                            <div className="pt-4">
                                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Pix Copia e Cola</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={pixQrCode.payload} 
                                        className="w-full bg-surface/50 border border-white/5 px-4 py-3 text-text-secondary text-sm font-mono truncate focus:outline-none"
                                    />
                                    <button 
                                        onClick={handleCopyPix}
                                        className="bg-primary hover:bg-accent text-background px-4 py-3 flex items-center justify-center transition-colors min-w-[50px]"
                                    >
                                        {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-xs text-text-muted flex items-center justify-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Aguardando confirmação do banco...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handlePayment} className="space-y-8">
                            <div className="glass p-6 space-y-6">
                                <h3 className="font-semibold text-lg text-white font-heading">Suas Informações</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Nome Completo</label>
                                        <input 
                                            value={name} onChange={e => setName(e.target.value)} required
                                            className="w-full bg-surface/50 border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                                            placeholder="Nome igual ao documento"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">CPF / CNPJ</label>
                                        <input 
                                            value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} required
                                            className="w-full bg-surface/50 border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                                            placeholder="Apenas números"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-6 space-y-6">
                                <h3 className="font-semibold text-lg text-white font-heading flex justify-between items-center">
                                    Método de Pagamento
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('PIX')}
                                        className={`p-4 border text-left transition-colors flex items-center gap-3 ${paymentMethod === 'PIX' ? 'border-accent bg-accent/5' : 'border-white/5 bg-surface/50 hover:bg-surface'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'PIX' ? 'border-accent' : 'border-text-muted'}`}>
                                            {paymentMethod === 'PIX' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                        </div>
                                        <QrCode className={`w-6 h-6 ${paymentMethod === 'PIX' ? 'text-accent' : 'text-text-muted'}`} />
                                        <div>
                                            <p className="font-bold text-white leading-tight">PIX</p>
                                            <p className="text-xs text-text-muted font-medium">Aprovação imediata</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                                        className={`p-4 border text-left transition-colors flex items-center gap-3 ${paymentMethod === 'CREDIT_CARD' ? 'border-accent bg-accent/5' : 'border-white/5 bg-surface/50 hover:bg-surface'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CREDIT_CARD' ? 'border-accent' : 'border-text-muted'}`}>
                                            {paymentMethod === 'CREDIT_CARD' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                        </div>
                                        <CreditCard className={`w-6 h-6 ${paymentMethod === 'CREDIT_CARD' ? 'text-accent' : 'text-text-muted'}`} />
                                        <div>
                                            <p className="font-bold text-white leading-tight">Cartão de Crédito</p>
                                            <p className="text-xs text-text-muted font-medium">Confirmação rápida</p>
                                        </div>
                                    </button>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {paymentMethod === 'CREDIT_CARD' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-5 pt-4"
                                        >
                                            <div>
                                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Número do Cartão</label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                                    <input 
                                                        value={cardNumber} onChange={e => setCardNumber(e.target.value)} required={paymentMethod === 'CREDIT_CARD'}
                                                        className="w-full bg-background border border-white/5 pl-12 pr-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors font-mono"
                                                        placeholder="0000 0000 0000 0000"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Nome Impresso no Cartão</label>
                                                <input 
                                                    value={holderName} onChange={e => setHolderName(e.target.value.toUpperCase())} required={paymentMethod === 'CREDIT_CARD'}
                                                    className="w-full bg-background border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                                                    placeholder="NOME IGUAL NO CARTÃO"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Validade</label>
                                                    <input 
                                                        value={expiry} onChange={e => setExpiry(e.target.value)} required={paymentMethod === 'CREDIT_CARD'}
                                                        className="w-full bg-background border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors font-mono"
                                                        placeholder="MM/AA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">CVV</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                                        <input 
                                                            value={ccv} onChange={e => setCcv(e.target.value)} required={paymentMethod === 'CREDIT_CARD'} maxLength={4}
                                                            className="w-full bg-background border border-white/5 pl-11 pr-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors font-mono"
                                                            placeholder="123"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-5 pt-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">CEP (Endereço)</label>
                                                    <input 
                                                        value={postalCode} onChange={e => setPostalCode(e.target.value)} required={paymentMethod === 'CREDIT_CARD'}
                                                        className="w-full bg-background border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                                                        placeholder="00000-000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Número</label>
                                                    <input 
                                                        value={addressNumber} onChange={e => setAddressNumber(e.target.value)} required={paymentMethod === 'CREDIT_CARD'}
                                                        className="w-full bg-background border border-white/5 px-4 py-3 text-white placeholder-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                                                        placeholder="Ex: 100"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-14 bg-primary hover:bg-accent text-background font-bold uppercase tracking-widest text-sm flex items-center justify-center transition-all shadow-lg shadow-primary/20 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar e Pagar'}
                            </button>
                        </form>
                    )}
                </div>

                {/* DIREITA: Resumo / Info do Plano */}
                <div className="lg:col-span-5">
                    <div className="glass p-6 md:p-8 space-y-6 sticky top-24 border-primary/20">
                        <h2 className="text-xl font-bold text-white font-heading border-b border-white/10 pb-4">Resumo do Pedido</h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-white">
                                <span className="font-medium text-lg text-text-secondary">{plan.name}</span>
                                <span className="font-bold text-2xl font-mono">
                                    R$ {plan.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <p className="text-sm text-text-secondary">Assinatura mensal para uso na plataforma criativa batuca.ia com processamento nativo via Asaas.</p>

                            <ul className="space-y-3 pt-6 border-t border-white/10">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span className="text-sm text-white font-medium">{plan.credits_granted} Moedas inclusas</span>
                                </li>
                                <li className="flex items-start gap-3 text-text-secondary">
                                    <CheckCircle className="w-5 h-5 text-accent/60 shrink-0" />
                                    <span className="text-sm">Acesso aos modelos Pro (Flux, Luma, Suno)</span>
                                </li>
                                <li className="flex items-start gap-3 text-text-secondary">
                                    <CheckCircle className="w-5 h-5 text-accent/60 shrink-0" />
                                    <span className="text-sm">Geração Múltipla Avançada</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-text-muted font-medium">
                            <Lock className="w-4 h-4" /> Pagamento Seguro via Asaas
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
