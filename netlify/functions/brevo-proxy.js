const BREVO_URL = 'https://fa1d7e0d.sibforms.com/serve/MUIFAFTxsSWLXXb0V2K87cJ3tPtTaLtUHUwBBlbCN0KBk9h3leoFWfKOffUqw5fh1_gs0GRfdKXhqFiYuEVbOvv0SAT4Mr5dyUzMpQChTnpNfi-YKEQwEltqqttdALGqQ9gPv38gGlevM7-qXGtAbXjaixGfaScVB7yowHPH7wDOwQlEtyN5AwzMmXQaQjsvLFa3H8Y-OvKaYjGfhQ==';

exports.handler = async (event) => {
    console.log('🔵 Proxy function called');
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const formData = JSON.parse(event.body);
        const response = await fetch(BREVO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        return {
            statusCode: response.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: response.ok, status: response.status })
        };
    } catch (error) {
        console.error('❌ Proxy error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Proxy error', message: error.message })
        };
    }
};