import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey)

async function requireAdmin() {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null;

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return null;
    return user.id;
}

export async function GET() {
    try {
        const adminId = await requireAdmin();
        if (!adminId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

        const { data: plans, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true })

        if (error) throw error;
        return NextResponse.json(plans)
    } catch (e) {
        console.error("Plans GET Error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const adminId = await requireAdmin();
        if (!adminId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

        const body = await req.json();
        const { action, id, ...planData } = body;

        if (action === 'CREATE') {
            const { data, error } = await supabaseAdmin
                .from('subscription_plans')
                .insert([planData])
                .select()
            if (error) throw error;
            return NextResponse.json({ success: true, plan: data[0] })
        }

        if (action === 'UPDATE') {
            if (!id) return NextResponse.json({ error: 'ID is required for UPDATE.' }, { status: 400 })
            const { data, error } = await supabaseAdmin
                .from('subscription_plans')
                .update(planData)
                .eq('id', id)
                .select()
            if (error) throw error;
            return NextResponse.json({ success: true, plan: data[0] })
        }

        if (action === 'DELETE') {
            if (!id) return NextResponse.json({ error: 'ID is required for DELETE.' }, { status: 400 })
            const { error } = await supabaseAdmin
                .from('subscription_plans')
                .delete()
                .eq('id', id)
            if (error) throw error;
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    } catch (e) {
        console.error("Plans POST Error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
