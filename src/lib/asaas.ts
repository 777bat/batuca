/**
 * Asaas Utility
 * Centralizes API key retrieval and URL normalization
 */

export function getAsaasConfig() {
    const baseUrl = process.env.ASAAS_URL || 'https://sandbox.asaas.com/api/v3';
    
    // Normalize URL: remove trailing slash
    const asaasUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Retrieve and normalize API Key
    let apiKey = '';
    const chaveKey = process.env.ASAAS_CHAVE;
    const baseKey = process.env.ASAAS_API_KEY_BASE;
    const directKey = process.env.ASAAS_API_KEY;

    if (chaveKey) {
        apiKey = chaveKey.startsWith('$') ? chaveKey : '$' + chaveKey;
    } else if (baseKey) {
        apiKey = baseKey.startsWith('$') ? baseKey : '$' + baseKey;
    } else if (directKey) {
        apiKey = directKey;
    }

    return {
        asaasUrl,
        apiKey,
        headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
        }
    };
}
