import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function getAuthUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

export async function GET() {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch musics
        const { data: musics, error: musicError } = await supabaseAdmin
            .from('generated_musics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (musicError) {
            console.error('Error fetching musics:', musicError)
        }

        // Map musics to common asset format
        const musicAssets = (musics || []).map(m => ({
            id: m.id || m.task_id,
            type: 'audio',
            prompt: m.prompt || 'Musica sem descricao',
            title: m.title || 'Musica Gerada',
            createdAt: m.created_at,
            status: ['success', 'completed', 'text_success', 'first_success'].includes(m.status?.toLowerCase()) ? 'done' :
                ['failed', 'error', 'create_task_failed'].includes(m.status?.toLowerCase()) ? 'error' : 'processing',
            url: m.audio_url,
            imageUrl: m.image_url,
            credits: m.cost || 5
        }))

        // Fetch other generations (images, videos)
        const { data: generations, error: genError } = await supabaseAdmin
            .from('generations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (genError) {
            console.error('Error fetching generations:', genError)
        }

        const genAssets = (generations || []).map(i => ({
            id: i.id || i.task_id,
            type: i.type || 'image',
            prompt: i.prompt || 'Sem descricao',
            title: i.prompt ? i.prompt.slice(0, 40) + '...' : 'Geracao',
            createdAt: i.created_at,
            status: i.status?.toLowerCase() === 'completed' || i.status?.toLowerCase() === 'success' ? 'done' :
                i.status?.toLowerCase() === 'failed' || i.status?.toLowerCase() === 'error' ? 'error' : 'processing',
            url: i.result_url,
            imageUrl: i.result_url,
            credits: i.cost || 1
        }))

        const allAssets = [...musicAssets, ...genAssets].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return NextResponse.json(allAssets)
    } catch (error) {
        console.error('Assets API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch assets.' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const assetId = url.searchParams.get('id')

        if (!assetId) {
            return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 })
        }

        let deleted = false

        // Try generations table (for image/video)
        const { data: genData } = await supabaseAdmin
            .from('generations')
            .delete()
            .eq('id', assetId)
            .eq('user_id', user.id)
            .select()

        if (genData && genData.length > 0) {
            deleted = true
        } else {
            // Try generated_musics
            const { data: musicData } = await supabaseAdmin
                .from('generated_musics')
                .delete()
                .eq('id', assetId)
                .eq('user_id', user.id)
                .select()

            if (musicData && musicData.length > 0) {
                deleted = true
            } else {
                // Try by task_id in generations
                const { data: genTaskData } = await supabaseAdmin
                    .from('generations')
                    .delete()
                    .eq('task_id', assetId)
                    .eq('user_id', user.id)
                    .select()

                if (genTaskData && genTaskData.length > 0) deleted = true

                // Try by task_id in musics
                const { data: musicTaskData } = await supabaseAdmin
                    .from('generated_musics')
                    .delete()
                    .eq('task_id', assetId)
                    .eq('user_id', user.id)
                    .select()

                if (musicTaskData && musicTaskData.length > 0) deleted = true
            }
        }

        if (deleted) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: 'Asset not found.' }, { status: 404 })
        }
    } catch (error) {
        console.error('Delete Asset API Error:', error)
        return NextResponse.json({ error: 'Failed to delete asset.' }, { status: 500 })
    }
}
