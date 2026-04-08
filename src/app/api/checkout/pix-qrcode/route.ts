import { NextResponse } from 'next/server'
import { getAsaasConfig } from '@/lib/asaas'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const paymentId = searchParams.get('id')

        if (!paymentId) {
            return NextResponse.json({ error: 'ID do pagamento não fornecido.' }, { status: 400 })
        }

        const { asaasUrl, headers } = getAsaasConfig()

        if (!headers.access_token) {
            return NextResponse.json({ error: 'Asaas API Key não configurada.' }, { status: 500 })
        }

        const res = await fetch(`${asaasUrl}/payments/${paymentId}/pixQrCode`, {
            headers,
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao buscar QR Code do PIX.')
        }

        return NextResponse.json({
            encodedImage: data.encodedImage, // base64 do QRCode
            payload: data.payload            // pix copia e cola
        })

    } catch (e: any) {
        console.error('Pix QrCode Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
