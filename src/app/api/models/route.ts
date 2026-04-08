import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
    try {
        const supabase = await createClient()

        // Fetch only models that are marked as physically active in the panel
        const { data, error } = await supabase
            .from('ai_models')
            .select('model_id, name, type, cost, provider')
            .eq('is_active', true)
            .order('cost', { ascending: true })

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch active models.' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error("Public Models API Error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
