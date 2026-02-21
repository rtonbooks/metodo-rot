// netlify/functions/brevo-proxy.js
// VERSÃO FINAL - SIMPLES E INFALÍVEL

exports.handler = async (event) => {
  // Headers CORS - essenciais para evitar erro CORB
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // ===== RESPONDER PREFLIGHT OPTIONS =====
  // O navegador sempre pergunta "pode?" antes de enviar
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // 204 = No content (perfeito para preflight)
      headers,
      body: ''
    };
  }

  // ===== SÓ ACEITAR POST =====
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // ===== LER DADOS DO FORMULÁRIO =====
    const data = JSON.parse(event.body);
    console.log('📦 Recebido:', data.email);

    // Validar email
    if (!data.email) {
      throw new Error('Email é obrigatório');
    }

    // ===== ENVIAR PARA API BREVO =====
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY, // Pega a chave do Netlify
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: data.email,
        attributes: {
          NOME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
          FIRSTNAME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
          SOURCE: 'Site Método RoT'
        },
        listIds: [5], // ID da lista (já configurado)
        updateEnabled: true // Atualiza se já existir
      })
    });

    const responseData = await response.json();
    console.log('📬 Resposta Brevo:', response.status);

    // ===== RETORNAR RESPOSTA PARA O SITE =====
    // IMPORTANTE: Sempre retornar 200 e incluir os headers
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: response.ok,
        message: response.ok ? '✓ Inscrito com sucesso!' : '✗ Erro no servidor',
        data: responseData
      })
    };

  } catch (error) {
    console.error('❌ Erro no proxy:', error);
    
    // Mesmo em erro, retornar 200 e incluir headers
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Erro interno. Tente novamente.'
      })
    };
  }
};