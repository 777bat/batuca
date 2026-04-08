import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('credits, role')
            .eq('id', user.id)
            .single()

        if (error || !profile) {
            return NextResponse.json({ error: 'Failed to fetch credits.' }, { status: 500 })
        }

        return NextResponse.json({ credits: profile.credits, role: profile.role })
    } catch (error) {
        console.error('Credits API Error:', error)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
