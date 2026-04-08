import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
// Admin client bypassing RLS, needed to retrieve auth emails and overwrite profiles dynamically
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey)

// 1. Authenticate caller to guarantee they are 'admin'
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

export async function GET(req: Request) {
    try {
        const adminId = await requireAdmin();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
        }

        // Fetch auth list
        const { data: authData, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
        if (authListError) {
            return NextResponse.json({ error: 'Failed to fetch auth users.' }, { status: 500 })
        }

        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) {
            return NextResponse.json({ error: 'Failed to fetch profiles.' }, { status: 500 })
        }

        // Merge logic
        const enrichedUsers = profiles.map(prof => {
            const authUser = authData.users.find(u => u.id === prof.id);
            return {
                ...prof,
                email: authUser?.email || 'Sem email associado',
                last_sign_in_at: authUser?.last_sign_in_at || null
            }
        });

        return NextResponse.json(enrichedUsers)

    } catch (e) {
        console.error("Admin API Error (GET):", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const adminId = await requireAdmin();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
        }

        const body = await req.json();
        const { action, user_id, amount, new_role } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'target user_id is required.' }, { status: 400 })
        }

        if (action === 'ALTER_CREDITS') {
            if (typeof amount !== 'number') return NextResponse.json({ error: 'amount is required.' }, { status: 400 })

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({ credits: amount })
                .eq('id', user_id)
                .select()

            if (error) throw error;
            return NextResponse.json({ success: true, profile: data[0] })

        } else if (action === 'ALTER_ROLE') {
            if (!new_role) return NextResponse.json({ error: 'new_role is required.' }, { status: 400 })

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({ role: new_role })
                .eq('id', user_id)
                .select()

            if (error) throw error;
            return NextResponse.json({ success: true, profile: data[0] })
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

    } catch (e) {
        console.error("Admin API Error (POST):", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
