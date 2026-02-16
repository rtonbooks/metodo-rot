// netlify/functions/brevo-proxy.js
const BREVO_URL = 'https://fa1d7e0d.sibforms.com/serve/MUIFAFTxsSWLXXb0V2K87cJ3tPtTaLtUHUwBBlbCN0KBk9h3leoFWfKOffUqw5fh1_gs0GRfdKXhqFiYuEVbOvv0SAT4Mr5dyUzMpQChTnpNfi-YKEQwEltqqttdALGqQ9gPv38gGlevM7-qXGtAbXjaixGfaScVB7yowHPH7wDOwQlEtyN5AwzMmXQaQjsvLFa3H8Y-OvKaYjGfhQ==';

exports.handler = async (event) => {
    // Log para diagnóstico (você verá isso nos logs do Netlify)
    console.log('🔵 Proxy function called - Method:', event.httpMethod);
    
    // Só aceita POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Pegar os dados enviados pelo formulário
        const formData = JSON.parse(event.body);
        console.log('📦 Dados recebidos:', { 
            email: formData.email,
            listIds: formData.listIds,
            hasCaptcha: !!formData['g-recaptcha-response']
        });

        // Preparar os dados para enviar ao Brevo
        const brevoData = {
            email: formData.email,
            attributes: formData.attributes || {
                NOME: formData.nome || '',
                FIRSTNAME: formData.nome || ''
            },
            listIds: formData.listIds || [5], // ID padrão 5
            updateEnabled: true // ← ESSA É A CHAVE! Garante que o contato seja adicionado à lista
        };

        // Se tiver captcha, incluir
        if (formData['g-recaptcha-response']) {
            brevoData['g-recaptcha-response'] = formData['g-recaptcha-response'];
        }

        console.log('📤 Enviando para o Brevo:', brevoData);

        // Enviar para o Brevo
        const response = await fetch(BREVO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(brevoData)
        });

        // Tentar ler a resposta (pode ser que o Brevo retorne HTML em vez de JSON)
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        console.log('📥 Resposta do Brevo:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
        });

        // Retornar o resultado para o navegador
        return {
            statusCode: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Lead adicionado com sucesso' : 'Erro ao adicionar lead'
            })
        };

    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        console.error(error.stack);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false,
                error: 'Proxy error',
                message: error.message 
            })
        };
    }
};