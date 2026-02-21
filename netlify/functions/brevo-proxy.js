// netlify/functions/brevo-proxy.js
// VERSÃO SIMPLIFICADA E TESTADA - 21/02/2026

exports.handler = async (event) => {
  // Headers CORS essenciais
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Responder OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método não permitido' })
    };
  }

  try {
    // Parse dos dados
    const data = JSON.parse(event.body);
    console.log('📦 Proxy recebeu:', { email: data.email });

    // Validar email
    if (!data.email) {
      throw new Error('Email é obrigatório');
    }

    // Verificar se a API key existe
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY não configurada no Netlify');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'API key não configurada. Configure no Netlify.'
        })
      };
    }

    // Payload para o Brevo (formato exato que eles esperam)
    const payload = {
      email: data.email,
      attributes: {
        NOME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
        FIRSTNAME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
        SOURCE: 'Site Método RoT'
      },
      listIds: [5], // ID da lista
      updateEnabled: true
    };

    console.log('📤 Enviando para Brevo:', payload);

    // Enviar para API do Brevo
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log('📬 Resposta do Brevo:', response.status, responseData);

    // Retornar sucesso ou erro
    return {
      statusCode: 200, // Sempre 200 para o front não quebrar
      headers,
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        message: response.ok ? '✓ Inscrito com sucesso!' : 'Erro ao processar no Brevo',
        data: responseData
      })
    };

  } catch (error) {
    console.error('❌ Erro no proxy:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Erro interno: ' + error.message
      })
    };
  }
};