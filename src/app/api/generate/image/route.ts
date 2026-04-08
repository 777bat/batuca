import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const KIE_API_KEY = process.env.KIE_API_KEY || '';
const MAX_PROMPT_LENGTH = 2000;

export async function POST(req: Request) {
    try {
        // Read body BEFORE accessing cookies to avoid stream conflicts in Next.js 16
        const textPayload = await req.text();
        let body;
        try {
            body = JSON.parse(textPayload);
        } catch (parseErr) {
            return NextResponse.json({ error: 'Invalid JSON payload received.' }, { status: 400 });
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { action, prompt, model, aspect_ratio, resolution, output_format, image_input, task_id } = body

        if (action === 'mark-failed') {
            const { task_id } = body
            if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })
            await supabaseAdmin.from('generations')
                .update({ status: 'failed' })
                .eq('task_id', task_id)
                .in('status', ['pending', 'processing'])
            return NextResponse.json({ success: true })
        }

        if (action === 'generate') {
            if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
            if (prompt.length > MAX_PROMPT_LENGTH) {
                return NextResponse.json({ error: `Prompt excede o limite de ${MAX_PROMPT_LENGTH} caracteres.` }, { status: 400 })
            }

            // 1. Check user credits and Model details
            const modelToUse = model || "flux-2/pro-text-to-image";

            // Get model cost from DB
            const { data: modelData } = await supabase
                .from('ai_models')
                .select('cost, is_active')
                .eq('model_id', modelToUse)
                .maybeSingle();

            if (modelData && !modelData.is_active) {
                return NextResponse.json({ error: 'Model currently disabled.' }, { status: 400 });
            }

            const modelCost = modelData?.cost ?? 1; // Default to 1 if not found

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 });
            }

            if (profile.credits < modelCost) {
                return NextResponse.json({
                    error: 'Créditos insuficientes.',
                    message: `Você precisa de pelo menos ${modelCost} crédito${modelCost !== 1 ? 's' : ''} para gerar uma imagem com este modelo. Saldo atual: ${profile.credits}`
                }, { status: 403 });
            }

            // 2. Call Kie.ai
            const payload: any = {
                model: modelToUse,
                input: {
                    prompt: prompt,
                    aspect_ratio: aspect_ratio || "16:9",
                    resolution: resolution || "1K"
                }
            }

            if (output_format) {
                payload.input.output_format = output_format;
            }

            if (image_input && image_input.length > 0) {
                let finalImageUrls = [];
                for (const img of image_input) {
                    if (img.startsWith('data:image')) {
                        // Extract base64 and mime type safely
                        const matches = img.match(/^data:(image\/\w+);base64,(.+)$/);
                        if (!matches) {
                            return NextResponse.json({ error: 'Invalid base64 image format.' }, { status: 400 });
                        }
                        const mimeType = matches[1];
                        const base64Data = matches[2];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const ext = mimeType.split('/')[1] || 'png';
                        const fileName = `img2img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

                        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                            .from('assets')
                            .upload(fileName, buffer, {
                                contentType: mimeType,
                                upsert: false
                            });

                        if (uploadError) {
                            console.error('Failed to upload image input to Supabase:', uploadError);
                            return NextResponse.json({ error: 'Failed to process reference image. Please try again.' }, { status: 500 });
                        }

                        const { data: publicUrlData } = supabaseAdmin.storage.from('assets').getPublicUrl(uploadData.path);
                        finalImageUrls.push(publicUrlData.publicUrl);
                    } else {
                        // It's already a URL
                        finalImageUrls.push(img);
                    }
                }
                payload.input.image_input = finalImageUrls;
            }

            const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (err) {
                console.error('Failed to parse JSON response from Kie API. Raw text:', textData);
                return NextResponse.json({ error: 'Falha ao processar resposta da API de imagem.' }, { status: 500 });
            }

            if (data.code !== 200 || !data.data?.taskId) {
                console.error('Kie API creation failed! Payload sent:', JSON.stringify(payload));
                console.error('Kie API response data:', data);
                return NextResponse.json({ error: 'Kie API failed', details: data }, { status: 500 });
            }

            // 3. Deduct credits & Store initial pending task
            const newTaskId = data.data.taskId;

            const { error: deductError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - modelCost })
                .eq('id', user.id);

            if (deductError) {
                console.error('Failed to deduct credits:', deductError);
            }

            await supabaseAdmin.from('generations').insert([{
                task_id: newTaskId,
                user_id: user.id,
                prompt: prompt,
                model: payload.model,
                type: 'image',
                status: 'pending',
                cost: modelCost,
                parameters: payload.input
            }]);

            return NextResponse.json(data)
        }

        else if (action === 'check') {
            if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 })

            // Check db status first
            const { data: genInfo } = await supabase
                .from('generations')
                .select('*')
                .eq('task_id', task_id)
                .single();

            // If it's already done in DB, we could technically skip querying the API, but let's query logic anyway

            const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${task_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                    'Accept': 'application/json'
                }
            })

            const data = await response.json()

            if (data.code === 200 && data.data) {
                const status = data.data.state; // 'waiting', 'queuing', 'generating', 'success', 'fail'

                // Update database based on terminal states
                if (status === 'success' || status === 'fail') {
                    // try parse image URL
                    let imageUrl = null;
                    if (status === 'success' && data.data.resultJson) {
                        try {
                            let parsed = data.data.resultJson;
                            if (typeof parsed === 'string') { parsed = JSON.parse(parsed); }
                            if (typeof parsed === 'string') { parsed = JSON.parse(parsed); }

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
                            console.error("Failed to parse result json", e, data.data.resultJson);
                        }
                    }

                    await supabaseAdmin.from('generations').update({
                        status: status === 'success' ? 'completed' : 'failed',
                        result_url: imageUrl,
                        completed_at: new Date().toISOString()
                    }).eq('task_id', task_id);
                } else {
                    // Update state to processing if it changed from pending
                    await supabaseAdmin.from('generations').update({
                        status: 'processing'
                    }).eq('task_id', task_id);
                }
            }

            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (error: any) {
        console.error('Audio Generate API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        )
    }
}
