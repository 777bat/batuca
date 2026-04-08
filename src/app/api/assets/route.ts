import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // Fetch musics
        const { data: musics, error: musicError } = await supabase
            .from('generated_musics')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (musicError) {
            console.error('Error fetching musics:', musicError)
        }

        // Map musics to common asset format
        const musicAssets = (musics || []).map(m => ({
            id: m.id || m.task_id,
            type: 'audio',
            prompt: m.prompt || 'Música sem descrição',
            title: m.title || 'Música Gerada',
            createdAt: m.created_at,
            status: m.status?.toLowerCase() === 'success' || m.status?.toLowerCase() === 'completed' ? 'done' :
                m.status?.toLowerCase() === 'failed' || m.status?.toLowerCase() === 'error' ? 'error' : 'processing',
            url: m.audio_url,
            imageUrl: m.image_url,
            credits: 5 // Default for Suno
        }))

        // Fetch other generations (images, videos)
        const { data: generations, error: genError } = await supabase
            .from('generations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (genError) {
            console.error('Error fetching generations:', genError)
        }

        const genAssets = (generations || []).map(i => ({
            id: i.id || i.task_id,
            type: i.type || 'image',
            prompt: i.prompt || 'Sem descrição',
            title: i.prompt ? i.prompt.slice(0, 40) + '...' : 'Geração',
            createdAt: i.created_at,
            status: i.status?.toLowerCase() === 'completed' || i.status?.toLowerCase() === 'success' ? 'done' :
                i.status?.toLowerCase() === 'failed' || i.status?.toLowerCase() === 'error' ? 'error' : 'processing',
            url: i.result_url,
            imageUrl: i.result_url, // For visual preview in the gallery
            credits: i.cost || 1 // Actual DB cost or default fallback
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
        const url = new URL(req.url);
        const assetId = url.searchParams.get('id');
        const userId = url.searchParams.get('user_id');

        if (!assetId || !userId) {
            return NextResponse.json(
                { error: 'Missing id or user_id query parameters.' },
                { status: 400 }
            );
        }

        let deleted = false;

        // Try generations table (for image/video)
        const { data: genData, error: genError } = await supabase
            .from('generations')
            .delete()
            .eq('id', assetId)
            .eq('user_id', userId)
            .select();

        if (genData && genData.length > 0) {
            deleted = true;
        } else {
            // Try generated_musics or generations if it was fallbacked
            const { data: musicData, error: musicError } = await supabase
                .from('generated_musics')
                .delete()
                .eq('id', assetId)
                .eq('user_id', userId)
                .select();
                
            if (musicData && musicData.length > 0) {
                 deleted = true;
            } else {
                 // Try if it was saved as task_id in generations
                 const { data: genTaskData } = await supabase
                     .from('generations')
                     .delete()
                     .eq('task_id', assetId)
                     .eq('user_id', userId)
                     .select();
                 
                 if (genTaskData && genTaskData.length > 0) deleted = true;
                 
                  // Try if it was saved as task_id in musics
                 const { data: musicTaskData } = await supabase
                     .from('generated_musics')
                     .delete()
                     .eq('task_id', assetId)
                     .eq('user_id', userId)
                     .select();
                 
                  if (musicTaskData && musicTaskData.length > 0) deleted = true;
            }
        }

        if (deleted) {
            return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
        } else {
             return NextResponse.json({ error: 'Asset not found or you do not have permission to delete it.' }, { status: 404 });
        }

    } catch (error: any) {
        console.error('Delete Asset API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
