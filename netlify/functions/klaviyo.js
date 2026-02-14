// netlify/functions/klaviyo.js
const fetch = require('node-fetch');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Revision',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Apenas POST permitido
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Parse dos dados recebidos do formulário
    const { name, email } = JSON.parse(event.body || '{}');

    if (!name || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nome e email são obrigatórios' })
      };
    }

    // Pega as credenciais das variáveis de ambiente
    const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
    const KLAVIYO_LIST_ID = process.env.KLAVIYO_LIST_ID;

    if (!KLAVIYO_API_KEY || !KLAVIYO_LIST_ID) {
      console.error('Credenciais do Klaviyo não configuradas');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erro de configuração do servidor' })
      };
    }

    // ============================================
    // NOVA API KLAVIYO (2024-10-15)
    // ============================================
    const url = `https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/`;

    // Formato correto para a nova API
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email: email,
                first_name: name.split(' ')[0],
                last_name: name.split(' ').slice(1).join(' ') || '',
              }
            }]
          },
          list_id: KLAVIYO_LIST_ID,
          subscriptions: {
            data: [{
              type: 'subscription',
              attributes: {
                channel: 'EMAIL',
                value: email
              }
            }]
          }
        }
      }
    };

    console.log('Enviando para Klaviyo (nova API):', JSON.stringify(requestBody, null, 2));

    // Faz a requisição para a nova API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'  // Versão estável da API
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.text();
    console.log('Resposta do Klaviyo:', responseData);

    // Retorna resposta para o frontend
    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: responseData 
        })
      };
    }

  } catch (error) {
    console.error('Erro na função Klaviyo:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};