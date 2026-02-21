// netlify/functions/brevo-proxy.js
// VERSÃO CORRIGIDA - com CORS funcionando

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

exports.handler = async (event) => {
  console.log('🔵 Proxy function iniciada');
  
  // ===== CABEÇALHOS CORS (o "crachá" que faltava) =====
  const headers = {
    'Access-Control-Allow-Origin': '*',           // Permite qualquer site
    'Access-Control-Allow-Headers': 'Content-Type', // Permite headers específicos
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // Permite métodos
    'Content-Type': 'application/json'
  };

  // ===== RESPOSTA PARA PREFLIGHT (REQUISIÇÃO OPTIONS) =====
  // O navegador sempre pergunta "pode?" antes de enviar
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔵 Respondendo preflight OPTIONS');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // ===== SÓ ACEITA POST =====
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // ===== PROCESSA O FORMULÁRIO =====
    const formData = JSON.parse(event.body);
    console.log('📦 Dados recebidos:', formData.email);

    // ===== ENVIA PARA O BREVO =====
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: formData.email,
        attributes: {
          NOME: formData.attributes?.NOME || '',
          FIRSTNAME: formData.attributes?.NOME || '',
          SOURCE: 'Site Método RoT'
        },
        listIds: formData.listIds || [5],
        updateEnabled: true
      })
    });

    const data = await response.json();
    console.log('📬 Resposta Brevo:', response.status);

    // ===== RESPOSTA COM OS CABEÇALHOS CORS =====
    return {
      statusCode: response.status,
      headers, // AQUI ESTÁ O SEGREDO! Sempre incluir os headers
      body: JSON.stringify({
        success: response.ok,
        message: response.ok ? 'Lead adicionado com sucesso' : 'Erro no Brevo',
        data: data
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