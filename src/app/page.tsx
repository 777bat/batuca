'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, Image as ImageIcon, Video, Music, Sparkles, Zap, AudioWaveform, Film, Aperture, Camera, Megaphone, PenTool, Globe, Mail, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

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

export default function LandingPage() {
  const [authModal, setAuthModal] = useState<null | 'login' | 'signup'>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAuthModal(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Fetch plans
  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data)
        }
      })
      .catch(err => console.error('Erro ao buscar planos:', err))
  }, [])

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.name.toLowerCase().includes('enterprise')) {
      window.location.href = 'mailto:contato@batuca.ia?subject=Plano%20Enterprise'
      return
    }

    if (plan.price === 0) {
      router.push('/login')
      return
    }

    setLoadingCheckout(plan.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast('Crie uma conta para assinar!')
        router.push('/signup')
        return
      }

      router.push(`/checkout/${plan.id}`)
    } catch (err: any) {
      console.error('Checkout error:', err)
      toast.error('Erro ao processar fluxo de assinatura.')
    } finally {
      setLoadingCheckout(null)
    }
  }

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.reveal:not(.reveal-active)')
    elements.forEach((el, idx) => {
      const parent = el.parentElement
      const siblings = parent
        ? Array.from(parent.children).filter((c) => c.classList.contains('reveal'))
        : []
      const siblingIndex = siblings.indexOf(el)
      if (siblingIndex !== -1) {
        ; (el as HTMLElement).style.animationDelay = `${siblingIndex * 150}ms`
      }
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [plans])

  return (
    <>
      {/* Global styles for this page */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes modal-scale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scroll { animation: scroll 30s linear infinite; }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-scale { animation: modal-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .reveal { opacity: 0; }
        .reveal-active { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-200 { animation-delay: 200ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-800 { animation-delay: 800ms; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-background text-text-primary font-heading">

        {/* Loading bar */}
        <div className="fixed top-0 left-0 w-full z-50 h-[1px] bg-border">
          <div className="h-full w-1/3 bg-accent" />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-40 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="batuca.ia" className="h-8 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-6">
              <a className="text-sm font-medium transition-colors text-text-primary hover:text-white" href="#features">Recursos</a>
              <a className="text-sm font-medium transition-colors text-text-primary hover:text-white" href="#pricing">Preços</a>
            </nav>
            <Link
              href="/login"
              className="text-white text-sm font-bold tracking-[0.1em] uppercase transition-colors hover:text-accent"
            >
              Entrar
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col">
          <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center animate-fade-in"
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCGXyi7RIk2zuOZmMwZIqJZXXoqDYFOBFMmMYuoDHW4lpEk5nisue8cXMxZUb_cIDHzkEVKQxBvhlx3uXg468wD7GnqcPr_7dktQJ82DSPKo1oBuBmiSstLb94trzQOVqsB_gL3TnU3QtQEB5iduj2zRU1phU7KoMytE_3tVnqoFiRya7JIJyLDTne_WrDSU5HA_tgJmGSbZZ_yuwgDjikkeMPHHSiZ5S5Wl12V-sKbwJ0GuTRGHA1jvk7dYSoXAAQ3GEu54tYtJqme')` }}
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Hero Content */}
            <div className="relative z-10 text-center flex flex-col items-center px-4 w-full max-w-5xl mx-auto">
              <h1 className="text-white text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-4 animate-fade-in-up font-heading">
                Inspire o Impossível.
              </h1>
              <p className="text-lg md:text-xl max-w-2xl font-light mb-12 leading-relaxed animate-fade-in-up delay-200 text-text-primary font-heading"
                style={{ opacity: 0, animationFillMode: 'forwards' }}>
                O estúdio definitivo para criação de mídias sintéticas.
              </p>

              {/* Chat Input Box */}
              <div className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 animate-fade-in-up delay-400 bg-black/40 backdrop-blur-xl border border-white/10"
                style={{
                  opacity: 0,
                  animationFillMode: 'forwards',
                }}>
                <div className="p-4 md:p-6">
                  <textarea
                    className="w-full h-24 resize-none text-white text-lg md:text-xl font-light no-scrollbar bg-transparent border-none outline-none"
                    placeholder="Descreva o que você deseja criar..."
                    onFocus={() => !authModal && router.push('/login')}
                  />
                </div>
                <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                  <div className="flex items-center gap-6">
                    {[
                      { icon: <ImageIcon size={18} className="text-accent" />, label: 'IMAGEM' },
                      { icon: <Video size={18} className="text-accent" />, label: 'VÍDEO' },
                      { icon: <Music size={18} className="text-accent" />, label: 'MÚSICA' },
                    ].map(({ icon, label }) => (
                      <Link key={label} href="/login"
                        className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors text-white/60 hover:text-accent font-heading"
                      >
                        <span className="flex items-center justify-center p-1 rounded-3xl bg-white/5">{icon}</span>
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-3 h-12 px-8 rounded-3xl font-bold text-xs tracking-widest uppercase transition-all duration-300 text-black bg-white hover:bg-accent hover:text-white font-heading"
                  >
                    <span>Começar</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <p className="mt-8 text-xs font-bold tracking-widest uppercase animate-fade-in delay-800 text-white/40 font-heading"
                style={{ opacity: 0, animationFillMode: 'forwards' }}>
                Uma única instrução. Infinitas possibilidades.
              </p>
            </div>
          </section>

          {/* Scrolling Carousel */}
          <section className="overflow-hidden py-8 bg-background border-y border-border">
            <div className="relative flex">
              <div className="flex gap-16 items-center animate-scroll whitespace-nowrap px-8">
                {[
                  { icon: <Music size={28} />, name: 'Suno' },
                  { icon: <Zap size={28} />, name: 'Nano Banana' },
                  { icon: <Sparkles size={28} />, name: 'Flux' },
                  { icon: <Music size={28} />, name: 'Suno' },
                  { icon: <Zap size={28} />, name: 'Nano Banana' },
                  { icon: <Sparkles size={28} />, name: 'Flux' },
                  { icon: <Music size={28} />, name: 'Suno' },
                  { icon: <Zap size={28} />, name: 'Nano Banana' },
                  { icon: <Sparkles size={28} />, name: 'Flux' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 transition-colors cursor-default text-white/40 hover:text-white">
                    <span className="text-accent">{item.icon}</span>
                    <span className="font-bold text-xl uppercase tracking-widest font-heading">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feature Grid */}
          <section id="features" className="py-24 px-6 md:px-12 lg:px-24 bg-background">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border border border-border rounded-3xl overflow-hidden">
              {[
                {
                  icon: <Film size={24} />,
                  title: 'Vídeo Cinematográfico',
                  desc: 'Gere sequências de movimento de alta fidelidade com controles avançados de câmera e integração de timeline. Perfeito para cineastas.',
                },
                {
                  icon: <Aperture size={24} />,
                  title: 'Renderização de Alta Fidelidade',
                  desc: 'Crie imagens impressionantes e ultrarrealistas. Utilize resoluções precisas e prompts negativos avançados.',
                },
                {
                  icon: <AudioWaveform size={24} />,
                  title: 'Áudio Atmosférico',
                  desc: 'Componha ricas paisagens sonoras e faixas musicais complexas usando textos, visualizadas através de ondas sonoras imersivas.',
                },
              ].map((f, i) => (
                <div key={i}
                  className="reveal p-10 md:p-12 flex flex-col transition-colors bg-[#030303]"
                  style={{}}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0A0A0A')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <div className="mb-6 flex items-center justify-center w-12 h-12 bg-surface text-accent border border-border">
                    {f.icon}
                  </div>
                  <h3 className="text-white text-2xl font-semibold mb-4 font-heading">
                    {f.title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-text-primary">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* AI Tools Showcase */}
          <section className="py-24 px-6 md:px-12 lg:px-24" style={{ backgroundColor: '#030303' }}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-20 reveal">
                <span className="text-xs tracking-widest uppercase mb-4 block font-bold text-accent" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Capacidades
                </span>
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  O Motor da Imaginação.
                </h2>
              </div>

              <div className="space-y-32">
                {/* Video Tool */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center reveal">
                  <div className="order-2 lg:order-1">
                    <h3 className="text-white text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Síntese de Vídeo Pro</h3>
                    <p className="text-lg font-light leading-relaxed mb-8" style={{ color: '#E0E0E0' }}>
                      Transforme roteiros em cinema. Nossa inteligência artificial entende de física, iluminação e movimento de câmera, entregando sequências 4K prontas para produção.
                    </p>
                    <ul className="space-y-4 text-sm tracking-wide" style={{ color: '#E0E0E0' }}>
                      {['Controle de Câmera Virtual', 'Motor de Consistência de Personagem', 'Renderização de Iluminação Dinâmica'].map(item => (
                        <li key={item} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 inline-block bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="order-1 lg:order-2 aspect-video relative overflow-hidden group rounded-3xl"
                    style={{ backgroundColor: '#0A0A0A', border: '1px solid #444' }}>
                    <img
                      alt="Cinematic video synthesis"
                      className="w-full h-full object-cover opacity-60 grayscale transition-all duration-700 group-hover:grayscale-0"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyxdDQgJOu1lqoH8dH7_ikqI8e5xeo7xBut6-hRJfHqCYm_i_buv4wK0MXrzotwAiE2Flv9j_qHbvDgvByao6cGnHAOUExOZc0zb0qdaZePHUKIkb27fXa5NnD5cqaRD2IjBzDnDWraEvKOO7ezojump_ndgHpTqqvZ-ajbP5FU4h1Sy1dbIHam1C6BZLFZGFusiAB3dY6EIfgjFMhBdcItaurehKm34TdntDqb_8AboAZDM-nTRnjJvNFWiMO_8TNTkwdz2d73snq"
                    />
                  </div>
                </div>

                {/* Image Tool */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center reveal">
                  <div className="aspect-square relative overflow-hidden group rounded-3xl"
                    style={{ backgroundColor: '#0A0A0A', border: '1px solid #444' }}>
                    <img
                      alt="Neural diffusion rendering"
                      className="w-full h-full object-cover opacity-60 grayscale transition-all duration-700 group-hover:grayscale-0"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ_rc5STTojGXZCw6HFqxv4n-CPMLSHsF2NVO9dgZXe6Zd1D3obl61tbVSqsf6tST-dvymasNKcW4Ef4MYZgy-j5yTJ9cJKgP9fVr6txMskldh0GNssic-nn1fgPz70SkxnO5-bs1quWyR1w0_HASmrvSh4OOcJsGnkRkHNZdx0yG4q8Zdbg4xLP4sWldNFeT3fbDZa7XXcuMCfwPDhNEkPPTTUBSpiS2Q4c0pRWYFk5GpLl1yH7f2PV8K1FEaCOSgVrkA_jT7a80O"
                    />
                  </div>
                  <div>
                    <h3 className="text-white text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Renderização por Difusão</h3>
                    <p className="text-lg font-light leading-relaxed mb-8" style={{ color: '#E0E0E0' }}>
                      Precisão a nível de pixel. Refine cada elemento de suas composições estáticas com feedback em tempo real e ampliação infinita das imagens.
                    </p>
                    <ul className="space-y-4 text-sm tracking-wide" style={{ color: '#E0E0E0' }}>
                      {['Exportação Multi-camadas', 'Síntese de Textura Avançada', 'Geração de Mapa de Profundidade 3D'].map(item => (
                        <li key={item} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 inline-block bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Music Tool */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center reveal">
                  <div className="order-2 lg:order-1">
                    <h3 className="text-white text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Síntese de Áudio Atmosférico</h3>
                    <p className="text-lg font-light leading-relaxed mb-8" style={{ color: '#E0E0E0' }}>
                      Componha ricos cenários e faixas musicais complexas. Nossas IAs sintetizam áudios em alta definição, transformando a imaginação pura em realidade sonora.
                    </p>
                    <ul className="space-y-4 text-sm tracking-wide" style={{ color: '#E0E0E0' }}>
                      {['Separação Multi-faixas', 'Sincronização Dinâmica de Batida', 'Masterização com Qualidade de Estúdio'].map(item => (
                        <li key={item} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 inline-block bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="order-1 lg:order-2 aspect-video relative overflow-hidden group flex items-center justify-center text-accent rounded-3xl"
                    style={{ backgroundColor: '#0A0A0A', border: '1px solid #444' }}>
                    <div className="opacity-60 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110">
                       <Music size={64} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-24 px-6 md:px-12 lg:px-24" style={{ backgroundColor: '#0A0A0A', borderTop: '1px solid #444', borderBottom: '1px solid #444' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 reveal">
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Feito para Criadores.
                </h2>
                <p className="max-w-2xl mx-auto font-light" style={{ color: '#E0E0E0' }}>
                  De artistas independentes a agências globais, batuca.ia fornece a infraestrutura para a próxima era da mídia.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <Camera size={40} />, title: 'Cinema de Última Geração', desc: 'Prototipar storyboards rapidamente ou gerar efeitos visuais finais para filmes e trailers independentes.' },
                  { icon: <Megaphone size={40} />, title: 'Marketing Ágil', desc: 'Crie ativos de campanha hiper-direcionados para mídias sociais e outdoors digitais em uma fração do tempo.' },
                  { icon: <PenTool size={40} />, title: 'Design e Visualização', desc: 'Visualize conceitos arquitetônicos e designs de produtos com iluminação atmosférica e texturas realistas.' },
                ].map((c, i) => (
                  <div key={i} className="reveal p-8 transition-colors rounded-3xl"
                    style={{ border: '1px solid #444', backgroundColor: '#030303' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#BFA2FE')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}>
                    <span className="mb-6 block text-accent">{c.icon}</span>
                    <h4 className="text-white text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.title}</h4>
                    <p className="text-sm font-light leading-relaxed" style={{ color: '#E0E0E0' }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-24 px-6 md:px-12 lg:px-24" style={{ backgroundColor: '#030303' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 reveal">
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  O Preço da Criação.
                </h2>
                <p className="font-light" style={{ color: '#E0E0E0' }}>Planos flexíveis desenhados para escalar com a sua ambição.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-3xl overflow-hidden" style={{ backgroundColor: '#444', border: '1px solid #444' }}>
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <div key={plan.id} className={`p-12 flex flex-col reveal relative ${plan.is_popular ? 'bg-[#0A0A0A]' : 'bg-[#030303]'}`}>
                      {plan.is_popular && (
                        <div className="absolute top-0 right-0 text-white text-xs font-bold tracking-widest uppercase px-4 py-1 bg-accent"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          Mais Popular
                        </div>
                      )}
                      <h4 className="text-white text-sm tracking-widest uppercase mb-2 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-white text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {plan.price === 0 && plan.name.toLowerCase().includes('enterprise') ? 'Sob Consulta' : `R$ ${plan.price}`}
                        </span>
                        {plan.price > 0 && <span className="text-sm" style={{ color: '#444' }}>/mês</span>}
                      </div>
                      <div className="mb-6 p-3 bg-white/5 border border-white/10">
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Incluído</p>
                        <p className="text-lg text-white font-mono font-bold">{plan.credits} créditos</p>
                      </div>
                      <ul className="space-y-4 mb-12 flex-grow">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#E0E0E0' }}>
                            <span className="text-accent"></span> {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={loadingCheckout !== null}
                        className={`w-full py-4 rounded-3xl text-center text-xs font-bold tracking-widest uppercase transition-all duration-300 block flex items-center justify-center gap-2 ${plan.is_popular ? 'bg-accent text-white hover:opacity-90' : 'text-white border border-[#444] hover:bg-white hover:text-black'}`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {loadingCheckout === plan.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          plan.name.toLowerCase().includes('enterprise') ? 'Falar com Vendas' : 'Assinar Plano'
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Fallback Static Plans */}
                    {/* Free */}
                    <div className="p-12 flex flex-col reveal" style={{ backgroundColor: '#030303' }}>
                      <h4 className="text-white text-sm tracking-widest uppercase mb-2 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Free</h4>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-white text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 0</span>
                        <span className="text-sm" style={{ color: '#444' }}>/mês</span>
                      </div>
                      <ul className="space-y-4 mb-12 flex-grow">
                        {['10 Gerações / dia', 'Resolução Padrão'].map(f => (
                          <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#E0E0E0' }}>
                            <span className="text-accent"></span> {f}
                          </li>
                        ))}
                        <li className="flex items-center gap-3 text-sm line-through" style={{ color: '#444' }}>
                          <span></span> Fila de Prioridade
                        </li>
                      </ul>
                      <Link href="/signup"
                        className="w-full py-4 rounded-3xl text-center text-xs font-bold tracking-widest uppercase transition-all duration-300 text-white block"
                        style={{ border: '1px solid #444', fontFamily: "'Space Grotesk', sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'black' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'white' }}>
                        Assinar Plano
                      </Link>
                    </div>

                    {/* Pro */}
                    <div className="p-12 flex flex-col relative reveal" style={{ backgroundColor: '#0A0A0A' }}>
                      <div className="absolute top-0 right-0 text-white text-xs font-bold tracking-widest uppercase px-4 py-1 bg-accent"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Mais Popular
                      </div>
                      <h4 className="text-white text-sm tracking-widest uppercase mb-2 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pro</h4>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-white text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 49</span>
                        <span className="text-sm" style={{ color: '#444' }}>/mês</span>
                      </div>
                      <ul className="space-y-4 mb-12 flex-grow">
                        {['Gerações Ilimitadas', 'Exportação em 4K Ultra-HD', 'Direitos Comerciais', 'Processamento Prioritário'].map(f => (
                          <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#E0E0E0' }}>
                            <span className="text-accent"></span> {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/signup"
                        className="w-full py-4 rounded-3xl text-center text-xs font-bold tracking-widest uppercase transition-all duration-300 text-white block hover:opacity-90 bg-accent"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Assinar Plano
                      </Link>
                    </div>

                    {/* Enterprise */}
                    <div className="p-12 flex flex-col reveal" style={{ backgroundColor: '#030303' }}>
                      <h4 className="text-white text-sm tracking-widest uppercase mb-2 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Enterprise</h4>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-white text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sob Consulta</span>
                      </div>
                      <ul className="space-y-4 mb-12 flex-grow">
                        {['Acesso à API', 'Nós de GPU Dedicada', 'Ajuste de Modelos Personalizados', 'Controles Multiusuários'].map(f => (
                          <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#E0E0E0' }}>
                            <span className="text-accent"></span> {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/signup"
                        className="w-full py-4 rounded-3xl text-center text-xs font-bold tracking-widest uppercase transition-all duration-300 text-white block"
                        style={{ border: '1px solid #444', fontFamily: "'Space Grotesk', sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'black' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'white' }}>
                        Falar com Vendas
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-12 px-6 text-center" style={{ backgroundColor: '#030303', borderTop: '1px solid #444' }}>
          <div className="mb-8 flex items-center justify-center gap-6">
            {[
              { icon: <Globe size={20} />, link: '#' },
              { icon: <Mail size={20} />, link: '#' },
              { icon: <FileText size={20} />, link: '#' }
            ].map((item, i) => (
              <a key={i} href={item.link}
                className="transition-colors flex items-center justify-center rounded-3xl border border-[#444] p-3 hover:border-accent hover:text-accent"
                style={{ color: '#444' }}
              >
                {item.icon}
              </a>
            ))}
          </div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#444', fontFamily: "'Space Grotesk', sans-serif" }}>
            © 2026 batuca.ia Studio. Todos os direitos reservados. Inspire o Impossível.
          </p>
        </footer>
      </div>
    </>
  )
}
