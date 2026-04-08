import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Connection
// For the backend, we use the service role key to forcefully save it without checking token headers for now
// Depending on auth strategy, this could use standard client with JWT.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Suno API (docs.sunoapi.org) wrapper
const SUNO_BASE_URL = 'https://api.sunoapi.org/api/v1/generate'

export async function POST(req: Request) {
    try {
        const apiKey = process.env.SUNO_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'SUNO_API_KEY is not configured.' }, { status: 500 })
        }

        const body = await req.json()
        const { action, prompt, style, task_id, title, customMode, instrumental, model, user_id } = body

        if (action === 'check') {
            if (!task_id) {
                return NextResponse.json({ error: 'task_id is required for checking status.' }, { status: 400 })
            }

            // Check task status
            // sunoapi.org format: GET /api/v1/generate/record-info?taskId=...
            const response = await fetch(`${SUNO_BASE_URL}/record-info?taskId=${task_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            })

            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
                console.log('[DEBUG SUNO] Check Data:', JSON.stringify(data, null, 2));
            } catch (err) {
                console.error('Failed to parse JSON status response:', textData);
                return NextResponse.json({ error: 'Invalid status response', details: textData }, { status: 500 });
            }

            // --- SAVE TO SUPABASE ON SUCCESS ---
            const status = data.data?.status || data.status;

            // --- UPDATING DB REGARDLESS OF STATUS ---
            const clips = data.data?.response || data.data?.clips || data.response || data.clips;
            let tracksToSave: any[] = [];

            if (clips) {
                if (Array.isArray(clips)) {
                    tracksToSave = clips;
                } else if (typeof clips === 'object') {
                    if (Array.isArray(clips.sunoData)) {
                        tracksToSave = clips.sunoData;
                    } else {
                        const clipKeys = Object.keys(clips);
                        tracksToSave = clipKeys.map(k => clips[k]);
                    }
                }
            }

            if (tracksToSave.length > 0) {
                for (const track of tracksToSave) {
                    const trackTitle = track.title || title || prompt?.slice(0, 40) || 'Song';
                    const img = track.imageUrl || track.image_url || '';
                    const finalAudio = track.audioUrl || track.audio_url || '';
                    const streamAudio = track.streamAudioUrl || track.stream_audio_url || '';

                    // Prefer final audio over stream audio for DB persistence
                    const urlToSave = finalAudio || streamAudio;

                    // We will update by matching track ID inside DB if we mapped it, 
                    // or just update by task_id if audio_url is empty. Since Suno creates 2 tracks,
                    // we'll insert them distinctively. We rely on audio_url or internal ID if available.

                    if (urlToSave || track.id) {
                        // Check if track already exists by track id if possible, else audio url
                        const query = track.id
                            ? supabase.from('generated_musics').select('id').eq('task_id', track.id) // using task_id column to store clip ID for granularity
                            : supabase.from('generated_musics').select('id').eq('audio_url', urlToSave);

                        const { data: existing } = await query.single();

                        if (!existing) {
                            await supabase
                                .from('generated_musics')
                                .insert([{
                                    task_id: track.id || task_id, // Save specific track id if available
                                    prompt: prompt || track.prompt || '',
                                    style: style || track.tags || '',
                                    title: trackTitle,
                                    audio_url: urlToSave,
                                    image_url: img,
                                    model: model || track.model_name || '',
                                    status: status
                                }]);
                        } else {
                            await supabase
                                .from('generated_musics')
                                .update({
                                    status: status,
                                    audio_url: urlToSave, // in case it turned from stream to final
                                    image_url: img,
                                    title: trackTitle
                                })
                                .eq('id', existing.id);
                        }
                    }
                }
            } else {
                // No clips emitted yet, update the placeholder row by task_id
                await supabase
                    .from('generated_musics')
                    .update({ status: status })
                    .eq('task_id', task_id)
                    .is('audio_url', null); // only update if audio is missing
            }
            // -----------------------------------

            return NextResponse.json(data)
        }

        else if (action === 'generate') {
            if (!user_id) {
                return NextResponse.json({ error: 'User ID is required for generation tracking.' }, { status: 400 })
            }

            let payload: any = {
                customMode: !!customMode,
                model: model || "V4_5",
                callBackUrl: "https://example.com/api/suno-callback" // Required by sunoapi.org
            }

            // 1. Check Model Cost and active status
            const { data: modelData } = await supabase
                .from('ai_models')
                .select('cost, is_active')
                .eq('model_id', payload.model)
                .maybeSingle();

            if (modelData && !modelData.is_active) {
                return NextResponse.json({ error: 'Model currently disabled.' }, { status: 400 });
            }

            const modelCost = modelData?.cost ?? 5; // Default cost to 5 if model not explicitly found

            // 2. Check user credits
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user_id)
                .single();

            if (profileError || !profile) {
                return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 });
            }

            if (profile.credits < modelCost) {
                return NextResponse.json({
                    error: 'Créditos insuficientes.',
                    message: `Você precisa de pelo menos ${modelCost} crédito${modelCost !== 1 ? 's' : ''} para gerar música. Saldo atual: ${profile.credits}`
                }, { status: 403 });
            }

            if (customMode) {
                payload.instrumental = !!instrumental;

                if (!instrumental) {
                    if (!prompt) return NextResponse.json({ error: 'Prompt is required for vocal songs.' }, { status: 400 })
                    payload.prompt = prompt;
                }

                payload.style = style || "";
                payload.title = title || "Generated Song";
            } else {
                if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
                payload.prompt = prompt;
                payload.instrumental = false;
            }

            const response = await fetch(SUNO_BASE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (err) {
                console.error('Failed to parse JSON response from Suno API:', textData);
                return NextResponse.json({ error: 'Invalid response from Suno API', details: textData }, { status: 500 });
            }

            // 2. INSERT PENDING TASK PLACEHOLDER & DEDUCT CREDITS
            const newTaskId = data.data?.taskId || data.taskId || data.task_id;
            if (newTaskId) {
                // Deduct credits
                const { error: deductError } = await supabase
                    .from('profiles')
                    .update({ credits: profile.credits - modelCost })
                    .eq('id', user_id);

                if (deductError) {
                    console.error('Failed to deduct credits:', deductError);
                    // We continue even if deduction fails for better UX, but we log it.
                    // In a production app, we might want to handle this more strictly.
                }

                await supabase.from('generated_musics').insert([{
                    task_id: newTaskId,
                    user_id: user_id,
                    prompt: prompt,
                    style: style || '',
                    title: title || prompt.slice(0, 40) || 'Nova Música',
                    model: model || 'V4_5',
                    status: 'PENDING',
                    cost: modelCost
                }]);
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
                    prompt: prompt.slice(0, 200), // API limit
                    callBackUrl: "https://example.com/api/suno-callback"
                })
            })

            const data = await response.json();
            return NextResponse.json(data)
        }

        else if (action === 'check-lyrics') {
            if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })

            const response = await fetch(`${SUNO_BASE_URL.replace('/generate', '')}/lyrics/record-info?taskId=${task_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            })

            const data = await response.json();
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (error: any) {
        console.error('Error in audio generation API:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
