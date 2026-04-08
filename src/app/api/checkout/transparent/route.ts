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

        const body = await req.json()
        const { planId, paymentMethod, cpfCnpj, name, creditCard, address } = body

        if (!planId || !paymentMethod || !cpfCnpj || !name) {
            return NextResponse.json({ error: 'Dados incompletos para gerar a cobranca.' }, { status: 400 })
        }

        // Validate cpfCnpj format (only digits, 11 or 14 chars)
        const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
        if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
            return NextResponse.json({ error: 'CPF/CNPJ invalido.' }, { status: 400 })
        }

        // Buscar detalhes do plano no banco
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError || !plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
        }

        const { asaasUrl, headers } = getAsaasConfig()

        if (!headers.access_token) {
            return NextResponse.json({ error: 'Asaas API Key não configurada.' }, { status: 500 })
        }

        // 1. Criar ou recuperar o Customer no Asaas
        const searchParams = new URLSearchParams({ cpfCnpj: cleanCpfCnpj })
        const customerSearchRes = await fetch(`${asaasUrl}/customers?${searchParams}`, { headers })
        
        if (!customerSearchRes.ok) {
            const errData = await customerSearchRes.json()
            console.error('[Checkout] Asaas Customer Search Error:', errData)
            throw new Error(`Asaas Search Error: ${errData.errors?.[0]?.description || 'Unknown'}`)
        }

        const customerSearch = await customerSearchRes.json()

        let customerId = ''
        if (customerSearch.data && customerSearch.data.length > 0) {
            customerId = customerSearch.data[0].id
        } else {
            // Criar novo cliente
            const createCustomerRes = await fetch(`${asaasUrl}/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    cpfCnpj,
                    email: user.email
                })
            })
            const newCustomer = await createCustomerRes.json()
            if (!createCustomerRes.ok) {
                console.error('[Checkout] Asaas Customer Creation Error:', newCustomer)
                throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente no Asaas.')
            }
            customerId = newCustomer.id
        }

        // 2. Criar a cobrança (Payment)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 1) // Vencimento amanha

        const basePayload: any = {
            customer: customerId,
            billingType: paymentMethod, // 'PIX' ou 'CREDIT_CARD'
            value: plan.price,
            dueDate: dueDate.toISOString().split('T')[0],
            description: `Assinatura ${plan.name} - batuca.ia`,
            externalReference: `${user.id}|||${plan.id}`,
        }

        if (paymentMethod === 'CREDIT_CARD') {
            if (!creditCard || !address) {
                return NextResponse.json({ error: 'Dados do cartão de crédito e endereço são obrigatórios.' }, { status: 400 })
            }
            basePayload.creditCard = creditCard
            basePayload.creditCardHolderInfo = {
                name: creditCard.holderName,
                email: user.email,
                cpfCnpj,
                postalCode: address.postalCode,
                addressNumber: address.addressNumber,
                phone: address.phone || '11999999999'
            }
        }

        const paymentRes = await fetch(`${asaasUrl}/payments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(basePayload)
        })

        const paymentData = await paymentRes.json()

        if (!paymentRes.ok) {
            console.error('[Checkout] Asaas Payment Error:', paymentData)
            throw new Error(paymentData.errors?.[0]?.description || 'Erro ao processar pagamento.')
        }

        return NextResponse.json({ 
            success: true, 
            paymentId: paymentData.id, 
            status: paymentData.status,
            invoiceUrl: paymentData.invoiceUrl
        })

    } catch (e: any) {
        console.error('[Checkout] Transparent Checkout Catch Error:', e.message)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
