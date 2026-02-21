// netlify/functions/brevo-proxy.js
// VERSÃO SUPER SIMPLES - TESTE

exports.handler = async (event) => {
  // Headers CORS - essenciais
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
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Dados recebidos
    const formData = JSON.parse(event.body);
    console.log('📦 Dados:', formData.email);

    // RESPOSTA DE TESTE (simula sucesso)
    return {
      statusCode: 200,
      headers, // IMPORTANTE: incluir os headers
      body: JSON.stringify({
        success: true,
        message: 'Lead adicionado com sucesso (teste)',
        data: { id: 123 }
      })
    };

  } catch (error) {
    console.error('❌ Erro:', error);
    return {
      statusCode: 500,
      headers, // Incluir headers até no erro
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};