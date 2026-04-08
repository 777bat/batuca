import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const SUNO_BASE_URL = 'https://api.sunoapi.org/api/v1/generate'
const MAX_PROMPT_LENGTH = 5000
const MAX_STYLE_LENGTH = 1000
const MAX_TITLE_LENGTH = 100

export async function POST(req: Request) {
    try {
        const apiKey = process.env.SUNO_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'SUNO_API_KEY is not configured.' }, { status: 500 })
        }

        // Read body BEFORE accessing cookies to avoid stream conflicts in Next.js 16
        const body = await req.json()

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { action, prompt, style, task_id, title, customMode, instrumental, model, negativeTags, vocalGender } = body

        if (action === 'check') {
            if (!task_id) {
                return NextResponse.json({ error: 'task_id is required for checking status.' }, { status: 400 })
            }

            // Lookup owner from placeholder row
            const { data: placeholderRow } = await supabaseAdmin
                .from('generated_musics')
                .select('user_id')
                .eq('task_id', task_id)
                .not('user_id', 'is', null)
                .limit(1)
                .maybeSingle()
            const ownerUserId = placeholderRow?.user_id || user.id

            // Query Suno API for status
            const response = await fetch(`${SUNO_BASE_URL}/record-info?taskId=${task_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            })

            const textData = await response.text()
            let data
            try {
                data = JSON.parse(textData)
            } catch {
                return NextResponse.json({ error: 'Invalid status response.' }, { status: 500 })
            }

            const status = data.data?.status || data.status

            // Handle error statuses from Suno
            const errorStatuses = ['FAILED', 'ERROR', 'CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'SENSITIVE_CONTENT_DETECTED']
            if (errorStatuses.includes(status)) {
                await supabaseAdmin.from('generated_musics')
                    .update({ status: 'FAILED' })
                    .eq('task_id', task_id)
                return NextResponse.json(data)
            }

            // Extract clips from response (Suno returns sunoData array)
            const rawResponse = data.data?.response || data.data?.clips || data.response || data.clips
            let tracksToSave: any[] = []

            if (rawResponse) {
                if (Array.isArray(rawResponse)) {
                    tracksToSave = rawResponse
                } else if (typeof rawResponse === 'object') {
                    if (Array.isArray(rawResponse.sunoData)) {
                        tracksToSave = rawResponse.sunoData
                    } else {
                        tracksToSave = Object.values(rawResponse).filter((v: any) => v && typeof v === 'object' && v.id)
                    }
                }
            }

            if (tracksToSave.length > 0) {
                for (const track of tracksToSave) {
                    const trackTitle = track.title || title || prompt?.slice(0, 40) || 'Song'
                    const img = track.imageUrl || track.image_url || ''

                    // URL priority: source_audio_url > audioUrl > streamAudioUrl > sourceStreamAudioUrl
                    // source_audio_url = permanent Suno URL (best for download)
                    // audioUrl = temporary download URL
                    // streamAudioUrl = streaming URL (works for playback immediately)
                    const sourceAudio = track.sourceAudioUrl || track.source_audio_url || ''
                    const finalAudio = track.audioUrl || track.audio_url || ''
                    const streamAudio = track.streamAudioUrl || track.stream_audio_url || ''
                    const sourceStream = track.sourceStreamAudioUrl || track.source_stream_audio_url || ''

                    // For audio_url: use the best permanent URL available
                    // For playback: stream URL works immediately, final URL works after completion
                    const bestUrl = sourceAudio || finalAudio || streamAudio || sourceStream

                    if (bestUrl || track.id) {
                        // Check if track already exists
                        const { data: existing } = await supabaseAdmin
                            .from('generated_musics')
                            .select('id, audio_url')
                            .eq('task_id', track.id)
                            .maybeSingle()

                        if (!existing) {
                            await supabaseAdmin.from('generated_musics').insert([{
                                task_id: track.id || task_id,
                                user_id: ownerUserId,
                                prompt: prompt || track.prompt || '',
                                style: style || track.tags || '',
                                title: trackTitle,
                                audio_url: bestUrl,
                                image_url: img,
                                model: model || track.model_name || '',
                                status: status
                            }])
                        } else {
                            // Update: upgrade URL if we now have a better one (source > final > stream)
                            const currentUrl = existing.audio_url || ''
                            const isCurrentStream = currentUrl.includes('musicfile.removeai.ai') || currentUrl.includes('audiopipe.suno.ai')
                            const hasBetterUrl = (sourceAudio || finalAudio) && isCurrentStream

                            await supabaseAdmin.from('generated_musics').update({
                                status: status,
                                audio_url: hasBetterUrl ? (sourceAudio || finalAudio) : (bestUrl || currentUrl),
                                image_url: img || undefined,
                                title: trackTitle
                            }).eq('id', existing.id)
                        }
                    }
                }
            } else {
                // No clips yet - update placeholder status
                await supabaseAdmin
                    .from('generated_musics')
                    .update({ status: status })
                    .eq('task_id', task_id)
                    .is('audio_url', null)
            }

            return NextResponse.json(data)
        }

        else if (action === 'mark-failed') {
            // Called by frontend when polling times out
            if (!task_id) {
                return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })
            }
            await supabaseAdmin.from('generated_musics')
                .update({ status: 'FAILED' })
                .eq('task_id', task_id)
                .in('status', ['PENDING', 'PROCESSING', 'TEXT_SUCCESS', 'FIRST_SUCCESS'])
            return NextResponse.json({ success: true })
        }

        else if (action === 'generate') {
            if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
                return NextResponse.json({ error: `Prompt excede o limite de ${MAX_PROMPT_LENGTH} caracteres.` }, { status: 400 })
            }
            if (style && style.length > MAX_STYLE_LENGTH) {
                return NextResponse.json({ error: `Estilo excede o limite de ${MAX_STYLE_LENGTH} caracteres.` }, { status: 400 })
            }
            if (title && title.length > MAX_TITLE_LENGTH) {
                return NextResponse.json({ error: `Titulo excede o limite de ${MAX_TITLE_LENGTH} caracteres.` }, { status: 400 })
            }

            const selectedModel = model || "V4_5ALL"

            let payload: any = {
                customMode: !!customMode,
                model: selectedModel,
                callBackUrl: "https://example.com/api/suno-callback"
            }

            const { data: modelData } = await supabaseAdmin
                .from('ai_models')
                .select('cost, is_active')
                .eq('model_id', selectedModel)
                .maybeSingle()

            if (modelData && !modelData.is_active) {
                return NextResponse.json({ error: 'Model currently disabled.' }, { status: 400 })
            }

            const modelCost = modelData?.cost ?? 5

            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single()

            if (profileError || !profile) {
                return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 })
            }

            if (profile.credits < modelCost) {
                return NextResponse.json({
                    error: 'Creditos insuficientes.',
                    message: `Voce precisa de pelo menos ${modelCost} credito${modelCost !== 1 ? 's' : ''} para gerar musica. Saldo atual: ${profile.credits}`
                }, { status: 403 })
            }

            if (customMode) {
                payload.instrumental = !!instrumental
                if (!instrumental) {
                    if (!prompt) return NextResponse.json({ error: 'Prompt is required for vocal songs.' }, { status: 400 })
                    payload.prompt = prompt
                }
                payload.style = style || ""
                payload.title = title || "Generated Song"
            } else {
                if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
                payload.prompt = prompt
                payload.instrumental = false
            }

            if (negativeTags) payload.negativeTags = negativeTags
            if (vocalGender && (vocalGender === 'm' || vocalGender === 'f')) payload.vocalGender = vocalGender

            const response = await fetch(SUNO_BASE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const textData = await response.text()
            let data
            try {
                data = JSON.parse(textData)
            } catch {
                return NextResponse.json({ error: 'Invalid response from Suno API.' }, { status: 500 })
            }

            const newTaskId = data.data?.taskId || data.taskId || data.task_id
            if (newTaskId) {
                await supabaseAdmin.from('profiles')
                    .update({ credits: profile.credits - modelCost })
                    .eq('id', user.id)

                await supabaseAdmin.from('generated_musics').insert([{
                    task_id: newTaskId,
                    user_id: user.id,
                    prompt: prompt,
                    style: style || '',
                    title: title || prompt?.slice(0, 40) || 'Nova Musica',
                    model: selectedModel,
                    status: 'PENDING',
                }])
            }

            return NextResponse.json(data)
        }

        else if (action === 'generate-lyrics') {
            if (!prompt) return NextResponse.json({ error: 'Prompt is required for lyrics generation.' }, { status: 400 })

            const response = await fetch(`${SUNO_BASE_URL.replace('/generate', '')}/lyrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt.slice(0, 200),
                    callBackUrl: "https://example.com/api/suno-callback"
                })
            })

            const data = await response.json()
            return NextResponse.json(data)
        }

        else if (action === 'check-lyrics') {
            if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })

            const response = await fetch(`${SUNO_BASE_URL.replace('/generate', '')}/lyrics/record-info?taskId=${task_id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${apiKey}` }
            })

            const data = await response.json()
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (error: any) {
        console.error('Error in audio generation API:', error)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
