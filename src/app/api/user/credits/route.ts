import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('credits, role')
            .eq('id', userId)
            .single()

        if (error || !profile) {
            console.error('Error fetching credits:', error)
            return NextResponse.json({ error: 'Failed to fetch credits.' }, { status: 500 })
        }

        return NextResponse.json({ credits: profile.credits, role: profile.role })
    } catch (error) {
        console.error('Credits API Error:', error)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
