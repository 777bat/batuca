import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const FAL_KEY = process.env.FAL_KEY || ''; // Needs to be added to .env.local

export async function POST(req: Request) {
    try {
        const textPayload = await req.text();
        let body;
        try {
            body = JSON.parse(textPayload);
        } catch (parseErr) {
            console.error("Failed to parse request JSON. Payload start:", textPayload.substring(0, 200));
            return NextResponse.json({ error: 'Invalid JSON payload received.' }, { status: 400 });
        }

        const { action, prompt, model, ratio, duration, user_id, task_id } = body;

        if (action === 'generate') {
            if (!user_id) {
                return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
            }
            if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })

            // Fal.ai endpoints:
            // fal-ai/kling-video/v1.6/standard/text-to-video
            // fal-ai/kling-video/v1.6/pro/text-to-video
            // fal-ai/minimax-video/image-to-video (actually text-to-video on Fal site depends on how you call it, usually just minimax)
            
            // By default use Kling standard if none provided
            const modelToUse = model || "fal-ai/kling-video/v1.6/standard/text-to-video";

            // Get model cost from DB or default to 10 for video
            const { data: modelData } = await supabase
                .from('ai_models')
                .select('cost, is_active')
                .eq('model_id', modelToUse)
                .maybeSingle();

            if (modelData && !modelData.is_active) {
                return NextResponse.json({ error: 'Model currently disabled.' }, { status: 400 });
            }

            const modelCost = modelData?.cost ?? 10;

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
                    message: `Você precisa de pelo menos ${modelCost} crédito${modelCost !== 1 ? 's' : ''} para gerar este vídeo. Saldo atual: ${profile.credits}`
                }, { status: 403 });
            }

            if (!FAL_KEY) {
                return NextResponse.json({ error: 'FAL_KEY is not configured on the server.' }, { status: 500 });
            }

            // Clean duration to number if it has 's'
            const durationSec = duration ? parseInt(duration.replace('s', '')) : 5;

            // Submit to fal.ai queue
            // https://fal.ai/models/fal-ai/kling-video/v1.6/standard/text-to-video/api
            const payload: any = {
                prompt: prompt,
                aspect_ratio: ratio || "16:9",
                duration: durationSec.toString()
            };

            const response = await fetch(`https://queue.fal.run/${modelToUse}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Fal.ai error submitting task:', errText);
                return NextResponse.json({ error: 'Fal.ai API failed', details: errText }, { status: response.status });
            }

            const data = await response.json();
            const newTaskId = data.request_id; // Fal returns request_id for queued tasks

            if (!newTaskId) {
                return NextResponse.json({ error: 'Failed to retrieve request_id from Fal API', details: data }, { status: 500 });
            }

            // Deduct credits & Store initial pending task
            const { error: deductError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - modelCost })
                .eq('id', user_id);

            if (deductError) {
                console.error('Failed to deduct credits:', deductError);
            }

            await supabase.from('generations').insert([{
                task_id: newTaskId,
                user_id: user_id,
                prompt: prompt,
                model: modelToUse,
                type: 'video',
                status: 'pending',
                cost: modelCost,
                parameters: payload
            }]);

            return NextResponse.json({ data: { taskId: newTaskId } });
        }

        else if (action === 'check') {
            if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })
            
            // Get model from db to know which fal endpoint to call for status
            const { data: genInfo } = await supabase
                .from('generations')
                .select('*')
                .eq('task_id', task_id)
                .single();

            const modelId = genInfo?.model || 'fal-ai/kling-video/v1.6/standard/text-to-video';

            // Querying fal status requires the model id and the request id
            const response = await fetch(`https://queue.fal.run/${modelId}/requests/${task_id}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errBody = await response.text();
                // If it's 404 maybe it's already done and cleared from queue, check the actual result endpoint
                if (response.status === 404) {
                     const resResult = await fetch(`https://queue.fal.run/${modelId}/requests/${task_id}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Key ${FAL_KEY}` }
                     });
                     if (resResult.ok) {
                         const resultData = await resResult.json();
                         let videoUrl = resultData?.video?.url || resultData?.url;
                         if (videoUrl) {
                            await supabase.from('generations').update({
                                status: 'completed',
                                result_url: videoUrl,
                                completed_at: new Date().toISOString()
                            }).eq('task_id', task_id);
            
                            return NextResponse.json({ code: 200, data: { state: 'success', resultJson: { url: videoUrl } } });
                         }
                     }
                }
                
                console.error("Fal check status error", errBody);
                return NextResponse.json({ error: 'Check failed', details: errBody }, { status: 500 });
            }

            const statusData = await response.json();
            const falStatus = statusData.status; // "IN_QUEUE", "IN_PROGRESS", "COMPLETED", etc

            if (falStatus === 'COMPLETED') {
                // Fetch the actual result
                const resResult = await fetch(`https://queue.fal.run/${modelId}/requests/${task_id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Key ${FAL_KEY}` }
                });
                
                const resultData = await resResult.json();
                
                // Usually video is in `video.url`
                let videoUrl = null;
                if (resultData && resultData.video && resultData.video.url) {
                    videoUrl = resultData.video.url;
                } else if (resultData && resultData.url) {
                   videoUrl = resultData.url; 
                }

                await supabase.from('generations').update({
                    status: 'completed',
                    result_url: videoUrl,
                    completed_at: new Date().toISOString()
                }).eq('task_id', task_id);

                return NextResponse.json({ code: 200, data: { state: 'success', resultJson: { url: videoUrl } } });
            } else if (falStatus && falStatus.toLowerCase().includes('fail')) {
                 await supabase.from('generations').update({
                    status: 'failed',
                    completed_at: new Date().toISOString()
                }).eq('task_id', task_id);
                
                return NextResponse.json({ code: 200, data: { state: 'fail' } });
            } else {
                 await supabase.from('generations').update({
                    status: 'processing'
                }).eq('task_id', task_id);

                return NextResponse.json({ code: 200, data: { state: 'generating' } });
            }
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (error: any) {
        console.error('Video Generate API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
