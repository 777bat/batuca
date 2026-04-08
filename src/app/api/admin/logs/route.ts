import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function requireAdmin() {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return null
    return user.id
}

export async function GET(req: NextRequest) {
    try {
        const adminId = await requireAdmin()
        if (!adminId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Fetch all profiles for user name mapping
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')

        const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

        // Fetch image/video generations
        let genQuery = supabaseAdmin
            .from('generations')
            .select('id, user_id, type, prompt, model, status, cost, result_url, created_at, task_id')
            .order('created_at', { ascending: false })

        if (type && type !== 'all' && type !== 'audio') {
            genQuery = genQuery.eq('type', type)
        }
        if (status && status !== 'all') {
            genQuery = genQuery.eq('status', status)
        }
        if (search) {
            genQuery = genQuery.ilike('prompt', `%${search}%`)
        }

        const { data: generations } = type === 'audio'
            ? { data: [] }
            : await genQuery.limit(limit)

        // Fetch music generations
        let musicQuery = supabaseAdmin
            .from('generated_musics')
            .select('id, user_id, title, prompt, style, model, status, audio_url, image_url, created_at, task_id')
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            musicQuery = musicQuery.eq('status', status)
        }
        if (search) {
            musicQuery = musicQuery.ilike('prompt', `%${search}%`)
        }

        const { data: musics } = (type && type !== 'all' && type !== 'audio')
            ? { data: [] }
            : await musicQuery.limit(limit)

        // Unify into a single array
        const genLogs = (generations || []).map(g => ({
            id: g.id,
            user_id: g.user_id,
            user_name: profileMap.get(g.user_id) || 'Desconhecido',
            type: g.type || 'image',
            prompt: g.prompt || '',
            model: g.model || '',
            status: g.status || 'pending',
            cost: g.cost || 1,
            result_url: g.result_url,
            created_at: g.created_at,
        }))

        const musicLogs = (musics || []).map(m => ({
            id: m.id,
            user_id: m.user_id,
            user_name: profileMap.get(m.user_id) || 'Desconhecido',
            type: 'audio',
            prompt: m.prompt || '',
            title: m.title || '',
            model: m.model || '',
            status: m.status || 'pending',
            cost: 5,
            result_url: m.audio_url,
            image_url: m.image_url,
            created_at: m.created_at,
        }))

        const allLogs = [...genLogs, ...musicLogs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(offset, offset + limit)

        return NextResponse.json({
            logs: allLogs,
            total: genLogs.length + musicLogs.length,
        })
    } catch (e) {
        console.error('Admin Logs API Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
