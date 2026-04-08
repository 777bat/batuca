import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const reqHeaders = await headers()
        
        // Verifica o token do webhook do Asaas configurado no painel
        const token = reqHeaders.get('asaas-access-token')
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
        
        if (expectedToken && token !== expectedToken) {
            console.error('Asaas Webhook Token inválido')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const event = body.event
        const payment = body.payment

        // Processa apenas pagamentos recebidos/confirmados
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const externalReference = payment?.externalReference

            if (externalReference && externalReference.includes('|||')) {
                const [userId, planId] = externalReference.split('|||')

                if (userId && planId) {
                    // 1. Busca o plano para saber quantos créditos adicionar
                    const { data: plan, error: planError } = await supabaseAdmin
                        .from('subscription_plans')
                        .select('*')
                        .eq('id', planId)
                        .single()

                    if (planError || !plan) {
                        console.error('Plano não encontrado no webhook:', planId)
                        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
                    }

                    // 2. Adiciona os créditos no perfil do usuário
                    const { data: profile, error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .select('credits')
                        .eq('id', userId)
                        .single()

                    if (profileError || !profile) {
                        console.error('Perfil não encontrado no webhook:', userId)
                        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
                    }

                    const currentCredits = profile.credits || 0
                    const newCredits = currentCredits + plan.credits

                    const { error: updateError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            credits: newCredits,
                            subscription_tier: plan.name.toLowerCase()
                        })
                        .eq('id', userId)

                    if (updateError) {
                        console.error('Erro ao atualizar créditos no webhook:', updateError)
                        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
                    }

                    console.log(`Sucesso: ${plan.credits} créditos concedidos ao usuário ${userId} via Asaas.`)
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error(`Erro no Asaas Webhook: ${err.message}`)
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
