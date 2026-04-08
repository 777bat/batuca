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

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || profile?.role !== 'admin') {
        return null;
    }

    return user.id;
}

// Admins GET all models unconditionally
export async function GET(req: Request) {
    try {
        const adminId = await requireAdmin();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
        }

        const { data, error } = await supabaseAdmin
            .from('ai_models')
            .select('*')
            .order('type', { ascending: true })
            .order('cost', { ascending: true });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch models.' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error("Admin Models API Error (GET):", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Admins PUT to update model config
export async function PUT(req: Request) {
    try {
        const adminId = await requireAdmin();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
        }

        const body = await req.json();
        const { id, action, payload } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'id and action are required.' }, { status: 400 })
        }

        if (action === 'TOGGLE_ACTIVE') {
            const { data, error } = await supabaseAdmin
                .from('ai_models')
                .update({ is_active: payload })
                .eq('id', id)
                .select()

            if (error) throw error;
            return NextResponse.json({ success: true, model: data[0] })

        } else if (action === 'UPDATE_COST') {
            const parsedCost = parseInt(payload);
            if (isNaN(parsedCost) || parsedCost < 0) return NextResponse.json({ error: 'Invalid cost payload.' }, { status: 400 })

            const { data, error } = await supabaseAdmin
                .from('ai_models')
                .update({ cost: parsedCost })
                .eq('id', id)
                .select()

            if (error) throw error;
            return NextResponse.json({ success: true, model: data[0] })
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (e) {
        console.error("Admin Models API Error (PUT):", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
