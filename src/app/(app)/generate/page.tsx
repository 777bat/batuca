'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import WaveformPlayer from '@/components/WaveformPlayer'
import { toast } from 'sonner'
import {
    Image, Video, Music, Wand2, Sliders, RotateCcw,
    Download, Share2, Loader2, Sparkles, ChevronDown, Info,
    Image as ImageIcon, Layout, Settings, History, ChevronRight, Play, Pause, Volume2, Trash2, Plus, LogOut, Search, CreditCard
} from 'lucide-react'

const tabs = [
    { id: 'image', label: 'Imagem', icon: Image, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'video', label: 'Vídeo', icon: Video, color: 'text-accent', gradient: 'from-violet-500 to-purple-600' },
    { id: 'audio', label: 'Música', icon: Music, color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
]

// Demo generated content (placeholder until API is connected)
const demoImages = [
    { id: '1', prompt: 'Cyberpunk city at night', url: null },
    { id: '2', prompt: 'Magical forest with glowing mushrooms', url: null },
    { id: '3', prompt: 'Abstract fluid art in purple and gold', url: null },
]

const videoModels = [
    { id: 'fal-ai/kling-video/v1.6/standard/text-to-video', label: 'Kling 1.6 Standard' },
    { id: 'fal-ai/kling-video/v1.6/pro/text-to-video', label: 'Kling 1.6 Pro' },
    { id: 'fal-ai/minimax-video/image-to-video', label: 'MiniMax Video' },
]

const musicStyles = [
    'Pop', 'Rock', 'Hip Hop', 'Eletrônica', 'Jazz', 'Clássica',
    'Lo-Fi', 'Samba', 'Funk', 'Forró', 'MPB', 'Reggaeton'
]

const aspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', 'auto']
const videoDurations = ['5s', '10s']

function ImageGenerator({ currentCredits, onGenerated, userId }: { currentCredits: number | null, onGenerated: () => void, userId: string | null }) {
    const [prompt, setPrompt] = useState('')
    const [negativePrompt, setNegativePrompt] = useState('')
    const [availableModels, setAvailableModels] = useState<any[]>([])
    const [model, setModel] = useState('')
    const [ratio, setRatio] = useState('1:1')
    const [resolution, setResolution] = useState('1K')
    const [outputFormat, setOutputFormat] = useState('png')
    const [imageInput, setImageInput] = useState('')
    const [imagePreview, setImagePreview] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<{ id?: string, url: string; prompt: string; model?: string; status: string }[]>([])
    const [showAdvanced, setShowAdvanced] = useState(false)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    setImagePreview(compressedBase64);
                    setImageInput(compressedBase64); // compressed base64 pra API
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        // Wait for userId to be resolved before fetching history
        // to avoid showing all users' images on first render
        if (!userId) return

        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/assets');
                if (res.ok) {
                    const data = await res.json();
                    const images = data.filter((d: any) => d.type === 'image');
                    setResults(images.map((img: any) => ({
                        id: img.id,
                        url: img.url || img.imageUrl,
                        prompt: img.prompt,
                        model: img.model || 'FLUX 2 Pro', // Assumido por padrão se não tiver
                        status: img.status
                    })));
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };

        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (res.ok) {
                    const data = await res.json();
                    const imagesOpts = data.filter((m: any) => m.type === 'image');
                    setAvailableModels(imagesOpts);
                    if (imagesOpts.length > 0 && !model) {
                        setModel(imagesOpts[0].model_id);
                    }
                }
            } catch (err) {
                console.error("Failed to load models list", err);
            }
        }

        fetchHistory();
        fetchModels();
    }, [userId]);

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        switch (status.toUpperCase()) {
            case 'SUCCESS':
            case 'COMPLETED':
            case 'DONE':
                return <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Concluído</div>;
            case 'FAILED':
            case 'ERROR':
                return <div className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Erro</div>;
            case 'PENDING':
            case 'PROCESSING':
            case 'RUNNING':
                return <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processando</div>;
            default:
                return null;
        }
    }

    const getModelLabel = (modelId: string) => {
        const found = availableModels.find(m => m.model_id === modelId);
        return found ? found.name : modelId;
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);

        try {
            // First step: start generation
            const response = await fetch('/api/generate/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    prompt,
                    model,
                    aspect_ratio: ratio,
                    resolution: resolution,
                    output_format: outputFormat,
                    image_input: imageInput ? [imageInput] : [],

                })
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error(data.message || 'Créditos insuficientes.');
                } else {
                    toast.error(data.error || 'Falha ao iniciar geração.');
                }
                setLoading(false);
                return;
            }

            const taskId = data.data?.taskId;
            if (!taskId) {
                console.error('Failed to start task.', data);
                setLoading(false);
                return;
            }

            // Immediately show a placeholder so the user knows it's working
            const placeholderPrompt = prompt.slice(0, 40) + '...';
            setResults(prev => [{
                id: taskId,
                url: '',
                prompt: placeholderPrompt,
                model: model,
                status: 'pending'
            }, ...prev]);

            // Instantly refresh credits
            onGenerated();

            // Polling logic
            let attempts = 0;
            const pollInterval = 3000; // 3 seconds
            const maxAttempts = 60; // max ~3 minutes

            const pollId = setInterval(async () => {
                attempts += 1;
                try {
                    const checkRes = await fetch('/api/generate/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check', task_id: taskId })
                    });
                    const checkData = await checkRes.json();

                    if (checkData.code === 200 && checkData.data) {
                        const status = checkData.data.state;

                        if (status === 'success') {
                            clearInterval(pollId);
                            setLoading(false);

                            let imageUrl = null;
                            try {
                                let parsed = checkData.data.resultJson;
                                if (typeof parsed === 'string') {
                                    parsed = JSON.parse(parsed); // First unescape
                                }
                                if (typeof parsed === 'string') {
                                    parsed = JSON.parse(parsed); // Just in case it was double-encoded
                                }

                                if (parsed) {
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        imageUrl = parsed[0];
                                    } else if (parsed.resultUrls && parsed.resultUrls.length > 0) {
                                        imageUrl = parsed.resultUrls[0];
                                    } else if (typeof parsed === 'string' && parsed.startsWith('http')) {
                                        imageUrl = parsed;
                                    } else if (parsed.url) {
                                        imageUrl = parsed.url;
                                    }
                                }
                            } catch (e) {
                                console.error("Parse result error:", e, checkData.data.resultJson);
                            }

                            if (imageUrl) {
                                setResults(prev => {
                                    const cleanPrev = prev.filter(p => p.id !== taskId);
                                    return [{ id: taskId, url: imageUrl as string, prompt: prompt, model: model, status: 'completed' }, ...cleanPrev];
                                });
                            } else {
                                setResults(prev => {
                                    const cleanPrev = prev.filter(p => p.id !== taskId);
                                    return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                                });
                                toast.error('Nenhuma imagem retornada (ou formato inválido).');
                            }

                        } else if (status === 'fail') {
                            clearInterval(pollId);
                            setLoading(false);
                            setResults(prev => {
                                const cleanPrev = prev.filter(p => p.id !== taskId);
                                return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                            });
                            toast.error('Erro na geração da imagem.');
                        }
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollId);
                        setLoading(false);
                        setResults(prev => {
                            const cleanPrev = prev.filter(p => p.id !== taskId);
                            return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                        });
                        toast.error('Tempo limite excedido.');
                    }
                } catch (pollErr) {
                    console.error('Polling error:', pollErr);
                }
            }, pollInterval);

        } catch (e) {
            console.error(e);
            setLoading(false);
            toast.error('Ocorreu um erro inesperado.');
        }
    }

    return (
        <div className="flex gap-6 h-full">
            {/* Controls panel */}
            <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {/* Prompt */}
                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Descreva a imagem que você quer criar..."
                        rows={4}
                        className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                {/* Model */}
                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2">Modelo</label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                        >
                            {availableModels.map(m => (
                                <option key={m.model_id} value={m.model_id}>
                                    {m.name} ( {m.cost})
                                </option>
                            ))}
                            {availableModels.length === 0 && <option value="">Carregando modelos...</option>}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2">Proporção</label>
                    <div className="relative">
                        <select
                            value={ratio}
                            onChange={e => setRatio(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                        >
                            {aspectRatios.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Advanced */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 border border-border rounded-2xl text-sm text-text-secondary hover:text-white transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        Opções avançadas
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                    <div className="bg-surface-2 border border-border rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="text-sm text-text-secondary block mb-1.5">Prompt negativo</label>
                            <textarea
                                value={negativePrompt}
                                onChange={e => setNegativePrompt(e.target.value)}
                                placeholder="O que NÃO quer na imagem..."
                                rows={2}
                                className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        {model === 'nano-banana-pro' && (
                            <>
                                <div>
                                    <label className="text-sm text-text-secondary block mb-1.5">Resolução</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['1K', '2K', '4K'].map(res => (
                                            <button
                                                key={res}
                                                onClick={() => setResolution(res)}
                                                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${resolution === res
                                                    ? 'bg-primary text-black'
                                                    : 'bg-surface border border-border text-text-secondary hover:border-accent hover:text-white'
                                                    }`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-text-secondary block mb-1.5">Formato</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['png', 'jpg'].map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => setOutputFormat(fmt)}
                                                className={`py-1.5 rounded-lg text-xs font-medium uppercase transition-all ${outputFormat === fmt
                                                    ? 'bg-primary text-black'
                                                    : 'bg-surface border border-border text-text-secondary hover:border-accent hover:text-white'
                                                    }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-text-secondary block mb-2 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        Imagem de Referência (Upload)
                                    </label>
                                    <div className="relative border-2 border-dashed border-border rounded-xl p-4 hover:border-violet-500/50 transition-colors text-center group cursor-pointer bg-surface">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {imagePreview ? (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-black/20">
                                                <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">Mudar Imagem</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-2 text-text-muted group-hover:text-text-secondary">
                                                <div className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 hidden" />
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <div className="text-xs">
                                                    <span className="font-medium text-accent">Clique para upload</span> ou arraste
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-2">Opcional. Use para transformar uma imagem (Image-to-Image).</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Generate button */}
                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            Gerar Imagem
                        </>
                    )}
                </button>
                <p className="text-xs text-center text-text-muted"> 1 crédito por geração</p>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-accent flex items-center justify-center mx-auto mb-4 pulse-glow">
                                <Wand2 className="w-8 h-8 text-accent" />
                            </div>
                            <p className="text-white font-medium">Gerando sua imagem...</p>
                            <p className="text-text-muted text-sm mt-1">Isso pode levar alguns segundos</p>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 pb-20 pr-2 custom-scrollbar">
                        {results.map((img, i) => (
                            <motion.div
                                key={img.id || i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-surface-2 border border-border flex flex-col"
                            >
                                {img.url ? (
                                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-4 text-center">
                                        {img.status.toLowerCase() === 'error' ? (
                                            <Wand2 className="w-8 h-8 text-red-500/50 mb-2" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-2" />
                                        )}
                                        <span className="text-xs text-text-muted line-clamp-2">{img.prompt}</span>
                                    </div>
                                )}

                                {/* Overlay / Footer details */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs font-medium text-white mb-2 line-clamp-2">{img.prompt}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {getStatusBadge(img.status)}
                                            {img.model && (
                                                <span className="px-2 py-0.5 bg-violet-500/10 text-accent border border-violet-500/20 rounded-full text-[10px] font-medium truncate max-w-[100px]">
                                                    {getModelLabel(img.model)}
                                                </span>
                                            )}
                                        </div>
                                        {img.url && (
                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </button>
                                                <a href={img.url} download className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {results.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                                <Image className="w-10 h-10 text-text-muted" />
                            </div>
                            <p className="text-white font-medium">Sua imagem aparecerá aqui</p>
                            <p className="text-text-muted text-sm mt-1">Digite um prompt e clique em Gerar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function VideoGenerator({ currentCredits, onGenerated, userId }: { currentCredits: number | null, onGenerated: () => void, userId: string | null }) {
    const [prompt, setPrompt] = useState('')
    const [availableModels, setAvailableModels] = useState<any[]>([])
    const [model, setModel] = useState('')
    const [duration, setDuration] = useState('5s')
    const [ratio, setRatio] = useState('16:9')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<{ id?: string, url: string; prompt: string; model?: string; status: string }[]>([])

    useEffect(() => {
        if (!userId) return

        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/assets');
                if (res.ok) {
                    const data = await res.json();
                    const videos = data.filter((d: any) => d.type === 'video');
                    setResults(videos.map((vid: any) => ({
                        id: vid.id,
                        url: vid.url || '',
                        prompt: vid.prompt,
                        model: vid.model || 'fal-ai/kling-video/v1.6/standard/text-to-video',
                        status: vid.status
                    })));
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };

        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (res.ok) {
                    const data = await res.json();
                    const videoOpts = data.filter((m: any) => m.type === 'video');
                    setAvailableModels(videoOpts.length > 0 ? videoOpts : videoModels);
                    if (videoOpts.length > 0 && !model) {
                        setModel(videoOpts[0].model_id);
                    } else if (!model) {
                        setModel(videoModels[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load models list", err);
                setAvailableModels(videoModels);
                if (!model) setModel(videoModels[0].id);
            }
        }

        fetchHistory();
        fetchModels();
    }, [userId]);

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        switch (status.toUpperCase()) {
            case 'SUCCESS':
            case 'COMPLETED':
            case 'DONE':
                return <div className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Concluído</div>;
            case 'FAILED':
            case 'ERROR':
                return <div className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Erro</div>;
            case 'PENDING':
            case 'PROCESSING':
            case 'RUNNING':
                return <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Gerando</div>;
            default:
                return null;
        }
    }

    const getModelLabel = (modelId: string) => {
        const found = availableModels.find(m => m.model_id === modelId || m.id === modelId);
        return found ? (found.name || found.label) : modelId;
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        setLoading(true)
        
        try {
            const response = await fetch('/api/generate/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    prompt,
                    model,
                    ratio,
                    duration,

                })
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error(data.message || 'Créditos insuficientes.');
                } else {
                    toast.error(data.error || 'Falha ao iniciar geração.');
                }
                setLoading(false);
                return;
            }

            const taskId = data.data?.taskId;
            if (!taskId) {
                console.error('Failed to start task.', data);
                setLoading(false);
                return;
            }

            const placeholderPrompt = prompt.slice(0, 40) + '...';
            setResults(prev => [{
                id: taskId,
                url: '',
                prompt: placeholderPrompt,
                model: model,
                status: 'pending'
            }, ...prev]);

            onGenerated();

            let attempts = 0;
            const pollInterval = 5000; // 5 seconds
            const maxAttempts = 60; // max 5 minutes for video

            const pollId = setInterval(async () => {
                attempts += 1;
                try {
                    const checkRes = await fetch('/api/generate/video', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check', task_id: taskId })
                    });
                    const checkData = await checkRes.json();

                    if (checkData.code === 200 && checkData.data) {
                        const status = checkData.data.state;

                        if (status === 'success') {
                            clearInterval(pollId);
                            setLoading(false);

                            let videoUrl = null;
                            try {
                                const parsed = checkData.data.resultJson;
                                if (parsed && parsed.url) {
                                    videoUrl = parsed.url;
                                }
                            } catch (e) {
                                console.error("Parse result error:", e, checkData.data.resultJson);
                            }

                            if (videoUrl) {
                                setResults(prev => {
                                    const cleanPrev = prev.filter(p => p.id !== taskId);
                                    return [{ id: taskId, url: videoUrl as string, prompt: prompt, model: model, status: 'completed' }, ...cleanPrev];
                                });
                                toast.success('Vídeo gerado com sucesso!');
                            } else {
                                setResults(prev => {
                                    const cleanPrev = prev.filter(p => p.id !== taskId);
                                    return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                                });
                                toast.error('Falha ao obter a URL do vídeo.');
                            }

                        } else if (status === 'fail') {
                            clearInterval(pollId);
                            setLoading(false);
                            setResults(prev => {
                                const cleanPrev = prev.filter(p => p.id !== taskId);
                                return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                            });
                            toast.error('Erro na geração do vídeo.');
                        }
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollId);
                        setLoading(false);
                        setResults(prev => {
                            const cleanPrev = prev.filter(p => p.id !== taskId);
                            return [{ id: taskId, url: '', prompt: prompt, model: model, status: 'error' }, ...cleanPrev];
                        });
                        toast.error('Tempo limite excedido.');
                    }
                } catch (pollErr) {
                    console.error('Polling error:', pollErr);
                }
            }, pollInterval);

        } catch (e) {
            console.error(e);
            setLoading(false);
            toast.error('Ocorreu um erro inesperado.');
        }
    }

    return (
        <div className="flex gap-6 h-full">
            <div className="w-80 flex-shrink-0 space-y-4">
                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Descreva o vídeo que você quer criar..."
                        rows={4}
                        className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2">Modelo</label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                        >
                            {availableModels.map(m => (
                                <option key={m.model_id || m.id} value={m.model_id || m.id}>
                                    {m.name || m.label} {m.cost ? `( ${m.cost})` : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                </div>

                <div className="bg-surface-2 border border-border rounded-2xl p-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary block mb-2">Duração</label>
                        <div className="flex gap-2">
                            {videoDurations.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${duration === d
                                        ? 'bg-primary text-black'
                                        : 'bg-surface border border-border text-text-secondary hover:border-violet-500/50'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-secondary block mb-2">Proporção</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['16:9', '9:16', '1:1'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRatio(r)}
                                    className={`py-2 rounded-lg text-sm font-medium transition-all ${ratio === r
                                        ? 'bg-primary text-black'
                                        : 'bg-surface border border-border text-text-secondary hover:border-violet-500/50'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Gerando vídeo...
                        </>
                    ) : (
                        <>
                            <Video className="w-4 h-4" />
                            Gerar Vídeo
                        </>
                    )}
                </button>
                <p className="text-xs text-center text-text-muted"> 10 créditos por vídeo de 5s</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-accent flex items-center justify-center mx-auto mb-4 pulse-glow">
                                <Video className="w-8 h-8 text-accent" />
                            </div>
                            <p className="text-white font-medium">Gerando seu vídeo...</p>
                            <p className="text-text-muted text-sm mt-1">Vídeos demoram de 30s a 2min</p>
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pb-20 pr-2 custom-scrollbar">
                         {results.map((vid, i) => (
                             <motion.div
                                 key={vid.id || i}
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="group relative aspect-video rounded-xl overflow-hidden bg-surface-2 border border-border flex flex-col"
                             >
                                 {vid.url ? (
                                    <video 
                                        src={vid.url} 
                                        controls 
                                        className="w-full h-full object-cover" 
                                        poster="" 
                                    />
                                 ) : (
                                     <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-4 text-center">
                                         {vid.status.toLowerCase() === 'error' || vid.status.toLowerCase() === 'failed' ? (
                                             <Video className="w-8 h-8 text-red-500/50 mb-2" />
                                         ) : (
                                             <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-2" />
                                         )}
                                         <span className="text-xs text-text-muted line-clamp-2">{vid.prompt}</span>
                                     </div>
                                 )}

                                 {!vid.url && (
                                     <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                         <p className="text-xs font-medium text-white mb-2 line-clamp-2">{vid.prompt}</p>
                                         <div className="flex items-center justify-between">
                                             <div className="flex gap-2">
                                                 {getStatusBadge(vid.status)}
                                                 {vid.model && (
                                                     <span className="px-2 py-0.5 bg-violet-500/10 text-accent border border-violet-500/20 rounded-full text-[10px] font-medium truncate max-w-[100px]">
                                                         {getModelLabel(vid.model)}
                                                     </span>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* Only show overlay on hover when a video exists so it doesn't block controls too much */}
                                 {vid.url && (
                                     <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex justify-between">
                                        <div className="flex flex-col gap-1">
                                            {getStatusBadge(vid.status)}
                                            {vid.model && (
                                                <span className="px-2 py-0.5 bg-violet-500/10 text-accent border border-violet-500/20 rounded-full text-[10px] font-medium truncate max-w-[100px]">
                                                   {getModelLabel(vid.model)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="pointer-events-auto">
                                             <a href={vid.url} download className="p-1.5 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/80 text-white transition-colors">
                                                 <Download className="w-4 h-4" />
                                             </a>
                                        </div>
                                     </div>
                                 )}
                             </motion.div>
                         ))}
                    </div>
                 )}

                {results.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                                <Video className="w-10 h-10 text-text-muted" />
                            </div>
                            <p className="text-white font-medium">Seus vídeos aparecerão aqui</p>
                            <p className="text-text-muted text-sm mt-1">Escolha um modelo e descreva o vídeo</p>

                            <div className="mt-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400 max-w-xs mx-auto">
                                <Info className="w-4 h-4 flex-shrink-0" />
                                <span>Vídeos demoram mais que imagens. Use prompts curtos e diretos para obter melhores resultados!</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function AudioGenerator({ currentCredits, onGenerated, userId }: { currentCredits: number | null, onGenerated: () => void, userId: string | null }) {
    const [prompt, setPrompt] = useState('')
    const [style, setStyle] = useState('')
    const [title, setTitle] = useState('')
    const [customMode, setCustomMode] = useState(false)
    const [instrumental, setInstrumental] = useState(false)
    const [availableModels, setAvailableModels] = useState<any[]>([])
    const [model, setModel] = useState('')
    const [negativeTags, setNegativeTags] = useState('')
    const [vocalGender, setVocalGender] = useState<'' | 'm' | 'f'>('')
    const [loading, setLoading] = useState(false)
    const [generatingLyrics, setGeneratingLyrics] = useState(false)
    const [results, setResults] = useState<{ id?: string, url: string; title: string; image_url?: string }[]>([])
    const [playing, setPlaying] = useState<string | null>(null)

    // Fetch History & Auth
    useEffect(() => {
        // Wait for userId to be resolved before fetching history
        if (!userId) return

        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/musics')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setResults(data.map(d => ({
                        id: d.id || d.task_id,
                        url: d.audio_url,
                        title: d.title || 'Música Salva',
                        image_url: d.image_url,
                        status: d.status
                    })))
                }
            } catch (err) {
                console.error("Failed to load history", err)
            }
        }

        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (res.ok) {
                    const data = await res.json();
                    const audioOpts = data.filter((m: any) => m.type === 'audio');
                    setAvailableModels(audioOpts);
                    if (audioOpts.length > 0 && !model) {
                        setModel(audioOpts[0].model_id);
                    }
                }
            } catch (err) {
                console.error("Failed to load models list", err);
            }
        }

        fetchHistory()
        fetchModels()
    }, [userId])

    const handleGenerate = async () => {
        if (!customMode && !prompt.trim()) return
        if (customMode && !instrumental && !prompt.trim()) return
        if (customMode && (!style.trim() || !title.trim())) return

        setLoading(true)

        try {
            // First step: start generation
            const response = await fetch('/api/generate/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', prompt, style, title, customMode, instrumental, model, negativeTags: negativeTags || undefined, vocalGender: vocalGender || undefined })
            })
            const data = await response.json()

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error(data.message || 'Créditos insuficientes.')
                } else {
                    toast.error(data.error || 'Falha ao iniciar geração.')
                }
                setLoading(false)
                return
            }

            // Assume API returns early with task_id. For sunoapi.org it's in data.data.taskId
            const taskId = data.data?.taskId || data.data?.task_id || data.taskId || data.task_id;
            if (!taskId) {
                console.error('Failed to start task.', data)
                setLoading(false)
                return
            }

            // Refresh credits instantly after successful start
            onGenerated();

            // Immediately show a placeholder so the user knows it's working
            const placeholderTitle = title || prompt.slice(0, 40) || 'Nova Música';
            let placeholderId = taskId;

            setResults(prev => [{
                id: placeholderId,
                url: '',
                title: `${placeholderTitle} (Preparando gerador...)`,
                image_url: '',
                status: 'PENDING'
            }, ...prev]);

            // Polling logic
            let attempts = 0;
            const pollInterval = 5000; // 5 seconds
            const maxAttempts = 40; // max ~3 minutes

            const pollId = setInterval(async () => {
                attempts += 1;
                try {
                    const checkRes = await fetch('/api/generate/audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check', task_id: taskId })
                    });
                    const checkData = await checkRes.json();

                    // Specific logic depends on GoAPI/PiAPI structure. Generally 
                    // checkData.data.status or checkData.status is returned.
                    const status = checkData.data?.status || checkData.status;

                    // Helper: extract clips from Suno response
                    const extractClips = () => {
                        const raw = checkData.data?.response || checkData.data?.clips || checkData.response || checkData.clips;
                        if (!raw) return [];
                        if (Array.isArray(raw)) return raw;
                        if (Array.isArray(raw.sunoData)) return raw.sunoData;
                        return Object.values(raw).filter((v: any) => v && typeof v === 'object' && v.id);
                    };

                    // Helper: get best audio URL from a clip
                    const getBestUrl = (c: any) =>
                        c.sourceAudioUrl || c.source_audio_url ||
                        c.audioUrl || c.audio_url ||
                        c.streamAudioUrl || c.stream_audio_url ||
                        c.sourceStreamAudioUrl || c.source_stream_audio_url || '';

                    const isFinal = status === 'SUCCESS' || status === 'completed';
                    const hasAudio = status === 'TEXT_SUCCESS' || status === 'FIRST_SUCCESS' || isFinal;
                    const isFailed = status === 'FAILED' || status === 'error' || status === 'CREATE_TASK_FAILED';

                    if (isFinal) {
                        clearInterval(pollId);
                        setLoading(false);
                    }

                    if (hasAudio) {
                        const clips = extractClips();
                        if (clips.length > 0) {
                            const newTracks = clips
                                .filter((c: any) => getBestUrl(c))
                                .map((c: any) => ({
                                    id: c.id || c.task_id || taskId,
                                    url: getBestUrl(c),
                                    title: c.title || prompt.slice(0, 40) || 'Musica Gerada',
                                    image_url: c.imageUrl || c.image_url || '',
                                    status: isFinal ? 'SUCCESS' : 'PROCESSING'
                                }));

                            if (newTracks.length > 0) {
                                setResults(prev => {
                                    const cleanPrev = prev.filter(p => p.id !== taskId && !p.title?.includes('(Preparando'));
                                    const filtered = cleanPrev.filter(p => !newTracks.find((n: any) => n.id === p.id));
                                    return [...newTracks, ...filtered];
                                });
                            }
                        }
                    } else if (isFailed) {
                        clearInterval(pollId);
                        setLoading(false);
                        setResults(prev => {
                            const clean = prev.filter(p => p.id !== taskId);
                            return [{ id: taskId, url: '', title: 'Erro ao gerar musica', status: 'FAILED' }, ...clean];
                        });
                    } else {
                        // PENDING/PROCESSING - update placeholder title
                        setResults(prev => prev.map(p =>
                            p.id === taskId
                                ? { ...p, title: `${title || prompt?.slice(0, 40) || 'Nova Musica'} (Gerando...)`, status: 'PROCESSING' }
                                : p
                        ));
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollId);
                        setLoading(false);
                        // Mark as failed in UI when polling times out
                        setResults(prev => prev.map(p =>
                            p.id === taskId && ((p as any).status === 'PROCESSING' || (p as any).status === 'PENDING')
                                ? { ...p, title: p.title?.replace(' (Gerando...)', '') || 'Musica', status: 'FAILED' }
                                : p
                        ));
                        // Also mark as failed in DB
                        fetch('/api/generate/audio', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'mark-failed', task_id: taskId })
                        }).catch(() => {});
                    }
                } catch (pollErr) {
                    console.error('Polling error:', pollErr);
                }
            }, pollInterval);

        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    const handleGenerateLyrics = async () => {
        if (!prompt.trim() || generatingLyrics) return
        setGeneratingLyrics(true)

        try {
            const payload = { action: 'generate-lyrics', prompt }
            const response = await fetch('/api/generate/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error(data.message || 'Créditos insuficientes para gerar música.')
                } else {
                    toast.error(data.error || 'Falha ao iniciar geração.')
                }
                setGeneratingLyrics(false)
                return
            }

            const taskId = data.data?.taskId || data.taskId || data.task_id
            const pollInterval = 3000
            const maxAttempts = 20

            let attempts = 0
            const pollId = setInterval(async () => {
                attempts++
                try {
                    const checkRes = await fetch('/api/generate/audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check-lyrics', task_id: taskId })
                    })
                    const checkData = await checkRes.json()
                    const status = checkData.data?.status

                    if (status === 'SUCCESS') {
                        clearInterval(pollId)
                        setGeneratingLyrics(false)
                        const lyricsResponse = checkData.data.response?.data?.[0] || checkData.data.response?.[0]
                        if (lyricsResponse) {
                            setPrompt(lyricsResponse.text || '')
                            if (lyricsResponse.title) setTitle(lyricsResponse.title)
                        }
                    } else if (['FAILED', 'CREATE_TASK_FAILED', 'GENERATE_LYRICS_FAILED', 'ERROR'].includes(status)) {
                        clearInterval(pollId)
                        setGeneratingLyrics(false)
                        console.error('Lyrics generation failed', checkData)
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollId)
                        setGeneratingLyrics(false)
                    }
                } catch (err) {
                    console.error('Lyrics poll error:', err)
                }
            }, pollInterval)

        } catch (err) {
            console.error('Lyrics generation error:', err)
            setGeneratingLyrics(false)
        }
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const s = status.toUpperCase();
        if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'TEXT_SUCCESS' || s === 'FIRST_SUCCESS') {
            return <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Concluido</div>;
        }
        if (s === 'FAILED' || s === 'ERROR' || s === 'CREATE_TASK_FAILED') {
            return <div className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit">Erro</div>;
        }
        if (s === 'PENDING' || s === 'PROCESSING' || s === 'RUNNING') {
            return <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-medium uppercase tracking-wider w-fit flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processando</div>;
        }
        return null;
    }

    return (
        <div className="flex gap-6 h-full">
            <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-2 pb-10">
                {/* Custom Mode Toggle */}
                <div className="bg-surface-2 border border-border rounded-2xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => setCustomMode(!customMode)}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm font-medium text-white block">Modo Avançado</span>
                            <span className="text-xs text-text-secondary">Maior controle sobre estilo e letra</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${customMode ? 'bg-emerald-500' : 'bg-[#2a2a3a]'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${customMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                {/* Instrumental Toggle (Only in Custom Mode) */}
                {customMode && (
                    <div className="bg-surface-2 border border-border rounded-2xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => setInstrumental(!instrumental)}>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-white block">Apenas Instrumental</span>
                                <span className="text-xs text-text-secondary">Sem vocais, apenas melodia</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${instrumental ? 'bg-emerald-500' : 'bg-[#2a2a3a]'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${instrumental ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Prompt / Lyrics Area */}
                {(!customMode || !instrumental) && (
                    <div className="bg-surface-2 border border-border rounded-2xl p-4">
                        <label className="text-sm font-medium text-text-secondary block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {customMode ? 'Letra da Música (Lyrics)' : 'Descrição da Música'}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={customMode ? "Cole ou escreva a letra da música..." : "Ex: Uma música pop animada sobre a vida na cidade grande..."}
                            rows={customMode ? 6 : 4}
                            maxLength={customMode ? 5000 : 500}
                            className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm resize-none focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <div className="text-right mt-1">
                            <span className={`text-[10px] ${prompt.length > (customMode ? 5000 : 500) ? 'text-red-400' : 'text-text-muted'}`}>
                                {prompt.length} / {customMode ? 5000 : 500}
                            </span>
                        </div>

                        {customMode && (
                            <button
                                onClick={handleGenerateLyrics}
                                disabled={generatingLyrics || !prompt.trim()}
                                className="mt-3 w-full bg-surface-3 border border-border hover:border-emerald-500/50 text-emerald-500 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {generatingLyrics ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Gerando Letra...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3" />
                                        Gerar Letra com IA
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Style & Title (Only in Custom Mode) */}
                {customMode && (
                    <>
                        <div className="bg-surface-2 border border-border rounded-2xl p-4">
                            <label className="text-sm font-medium text-text-secondary block mb-2">Estilo Musical (Gênero, Vibe)</label>
                            <input
                                type="text"
                                value={style}
                                onChange={e => setStyle(e.target.value)}
                                placeholder="Ex: upbeat pop, acoustic guitar, dark synthwave"
                                maxLength={1000}
                                className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm focus:outline-none focus:border-emerald-500 transition-colors mb-3"
                            />
                            {/* Preset buttons */}
                            <div className="flex flex-wrap gap-2">
                                {musicStyles.slice(0, 8).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            const currentArr = style.split(',').map(x => x.trim()).filter(Boolean);
                                            let newArr;
                                            if (currentArr.includes(s)) {
                                                newArr = currentArr.filter(x => x !== s);
                                            } else {
                                                newArr = [...currentArr, s];
                                            }
                                            setStyle(newArr.join(', '));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style.includes(s)
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-surface border border-border text-text-secondary hover:border-emerald-500/50'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface-2 border border-border rounded-2xl p-4">
                            <label className="text-sm font-medium text-text-secondary block mb-2">Título da Música</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Opcional: Meu Hit Número 1"
                                maxLength={100}
                                className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </>
                )}

                {/* Model Selection */}
                <div className="bg-surface-2 border border-border rounded-2xl p-4">
                    <label className="text-sm font-medium text-text-secondary block mb-2">Versao do Modelo</label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                        >
                            {availableModels.map(m => (
                                <option key={m.model_id} value={m.model_id}>
                                    {m.name} ({m.cost} creditos)
                                </option>
                            ))}
                            {availableModels.length === 0 && <option value="">Carregando modelos...</option>}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Vocal Gender (Custom Mode only) */}
                {customMode && !instrumental && (
                    <div className="bg-surface-2 border border-border rounded-2xl p-4">
                        <label className="text-sm font-medium text-text-secondary block mb-2">Genero Vocal</label>
                        <div className="flex gap-2">
                            {[{ value: '', label: 'Auto' }, { value: 'm', label: 'Masculino' }, { value: 'f', label: 'Feminino' }].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setVocalGender(opt.value as '' | 'm' | 'f')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${vocalGender === opt.value
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-surface border border-border text-text-secondary hover:border-emerald-500/50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Negative Tags (Custom Mode only) */}
                {customMode && (
                    <div className="bg-surface-2 border border-border rounded-2xl p-4">
                        <label className="text-sm font-medium text-text-secondary block mb-2">Estilos a Evitar</label>
                        <input
                            type="text"
                            value={negativeTags}
                            onChange={e => setNegativeTags(e.target.value)}
                            placeholder="Ex: autotune, screaming, heavy metal"
                            className="w-full bg-surface border border-border rounded-xl p-3 text-white placeholder-[#555568] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <p className="text-[10px] text-text-muted mt-1">Separe por virgula os estilos que nao deseja</p>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={(customMode ? (!instrumental && !prompt.trim()) || !style.trim() || !title.trim() : !prompt.trim()) || loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Compondo...
                        </>
                    ) : (
                        <>
                            <Music className="w-4 h-4" />
                            Gerar Música
                        </>
                    )}
                </button>
                <p className="text-xs text-center text-text-muted">
                    {availableModels.find(m => m.model_id === model)?.cost || '...'} creditos por geracao
                </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 pulse-glow">
                                <Music className="w-8 h-8 text-emerald-400" />
                            </div>
                            <p className="text-white font-medium">Compondo sua música...</p>
                            <p className="text-text-muted text-sm mt-1">IA trabalhando na composição</p>
                        </div>
                    </div>
                )}

                {/* Render new results */}
                {results.length > 0 && (
                    <div className="flex-1 overflow-y-auto space-y-6 pb-20 custom-scrollbar pr-2">
                        {results.map((track, i) => (
                            <div key={track.id || track.url || i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4 group hover:border-border transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 bg-cover bg-center" style={track.image_url ? { backgroundImage: `url(${track.image_url})` } : {}}>
                                        {!track.image_url && <Music className="w-6 h-6 text-emerald-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{track.title || 'Suno Track'}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStatusBadge((track as any).status)}
                                            <span className="text-sm text-text-secondary">
                                                {track.title?.includes('(Processando...)') ? 'Gerando preview...' : (track as any).status !== 'FAILED' ? 'Áudio Gerado' : 'Falha na geração'}
                                            </span>
                                        </div>
                                    </div>

                                    {track.url && (
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2.5 bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-emerald-500 rounded-lg transition-colors"
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    try {
                                                        const res = await fetch(track.url)
                                                        const blob = await res.blob()
                                                        const blobUrl = URL.createObjectURL(blob)
                                                        const a = document.createElement('a')
                                                        a.href = blobUrl
                                                        a.download = `${track.title || 'musica'}.mp3`
                                                        document.body.appendChild(a)
                                                        a.click()
                                                        document.body.removeChild(a)
                                                        URL.revokeObjectURL(blobUrl)
                                                    } catch {
                                                        window.open(track.url, '_blank')
                                                    }
                                                }}
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Render Custom Waveform Player */}
                                {track.url && (
                                    <div className="mt-1">
                                        <WaveformPlayer url={track.url} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {results.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                                <Music className="w-10 h-10 text-text-muted" />
                            </div>
                            <p className="text-white font-medium">Suas músicas aparecerão aqui</p>
                            <p className="text-text-muted text-sm mt-1">Descreva a música que quer criar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function GeneratePage() {
    const [activeTab, setActiveTab] = useState('image')
    const [userCredits, setUserCredits] = useState<number | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }
        }
        fetchUser()
    }, [supabase])

    const refreshCredits = useCallback(async () => {
        if (!userId) return
        try {
            const res = await fetch('/api/user/credits')
            const data = await res.json()
            if (typeof data.credits === 'number') {
                setUserCredits(data.credits)
            }
        } catch (err) {
            console.error('Failed to refresh credits:', err)
        }
    }, [userId])

    useEffect(() => {
        refreshCredits()
    }, [refreshCredits])

    return (
        <div className="h-screen flex flex-col bg-surface">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-lg font-bold text-white">Criar</h1>
                            <p className="text-xs text-text-muted">Imagens, Vídeos e Músicas com IA</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-black'
                                        : 'text-text-secondary hover:text-white hover:bg-surface-3'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'image' && <ImageGenerator currentCredits={userCredits} onGenerated={() => refreshCredits()} userId={userId} />}
                        {activeTab === 'video' && <VideoGenerator currentCredits={userCredits} onGenerated={() => refreshCredits()} userId={userId} />}
                        {activeTab === 'audio' && <AudioGenerator currentCredits={userCredits} onGenerated={() => refreshCredits()} userId={userId} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
