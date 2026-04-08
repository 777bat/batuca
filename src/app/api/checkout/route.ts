import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAsaasConfig } from '@/lib/asaas'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = await req.json()

        if (!planId) {
            return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 })
        }

        // Buscar detalhes do plano no banco
        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (error || !plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
        }

        const { asaasUrl, headers } = getAsaasConfig()

        if (!headers.access_token) {
            return NextResponse.json({ error: 'A chave da API (ASAAS_API_KEY) está vazia no servidor.' }, { status: 500 })
        }

        // Criar Link de Pagamento no Asaas
        // Passamos user.id e plan.id no externalReference para que o Webhook saiba quem pagou
        const payload = {
            name: `Plano: ${plan.name}`,
            description: plan.description || `Assinatura ${plan.name} - batuca.ia`,
            value: plan.price,
            billingType: 'UNDEFINED', // DEIXA O USUARIO ESCOLHER (PIX, BOLETO, CARTÃO)
            chargeType: 'DETACHED', // COBRANÇA ÚNICA (Habilita o PIX 100% no Asaas)
            externalReference: `${user.id}|||${plan.id}`,
            dueDateLimitDays: 5,
        }

        const response = await fetch(`${asaasUrl}/paymentLinks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        })

        const asaasData = await response.json()

        if (!response.ok) {
            console.error('Asaas Error:', asaasData)
            throw new Error(asaasData.errors?.[0]?.description || 'Erro ao gerar link de pagamento no Asaas')
        }

        return NextResponse.json({ url: asaasData.url })
    } catch (e: any) {
        console.error('Checkout Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
