// netlify/functions/brevo-proxy.js
// VERSÃO 2.0 - COM LOGS DETALHADOS E TRATAMENTO ROBUSTO

exports.handler = async (event) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS preflight
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
    // 1. LOG DO BODY RECEBIDO
    console.log('📦 Body recebido (raw):', event.body);
    
    // 2. PARSE DO JSON
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError.message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Erro ao processar dados: JSON inválido'
        })
      };
    }

    console.log('📦 Dados parseados:', JSON.stringify(data, null, 2));

    // 3. VALIDAÇÃO BÁSICA
    if (!data.email) {
      throw new Error('Email é obrigatório');
    }

    // 4. VERIFICAÇÃO DA API KEY
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('❌ BREVO_API_KEY não configurada');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'API key não configurada. Configure a variável BREVO_API_KEY no Netlify.'
        })
      };
    }
    
    console.log('✅ API Key encontrada (primeiros caracteres):', apiKey.substring(0, 5) + '...');

    // 5. PAYLOAD PARA O BREVO
    const payload = {
      email: data.email,
      attributes: {
        NOME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
        FIRSTNAME: data.attributes?.NOME || data.attributes?.FIRSTNAME || '',
        SOURCE: 'Site Método RoT',
        DATA_CADASTRO: new Date().toISOString().split('T')[0]
      },
      listIds: [5],
      updateEnabled: true
    };

    console.log('📤 Payload enviado para Brevo:', JSON.stringify(payload, null, 2));

    // 6. REQUISIÇÃO PARA O BREVO
    let response;
    try {
      response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (fetchError) {
      console.error('❌ Erro na requisição fetch:', fetchError.message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Erro de conexão com o Brevo: ' + fetchError.message
        })
      };
    }

    console.log('📬 Status da resposta do Brevo:', response.status);
    console.log('📬 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    // 7. LEITURA DA RESPOSTA
    let responseData;
    const responseText = await response.text();
    console.log('📬 Resposta bruta do Brevo:', responseText);

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
        console.log('📬 Resposta parseada:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta do Brevo:', parseError.message);
        responseData = { raw: responseText };
      }
    } else {
      console.log('⚠️ Resposta vazia do Brevo');
      responseData = { message: 'Resposta vazia' };
    }

    // 8. RETORNO PARA O FRONT
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        message: response.ok 
          ? '✓ Inscrito com sucesso!' 
          : `Erro no Brevo: ${response.status} - ${responseData?.message || 'Sem detalhes'}`,
        data: responseData
      })
    };

  } catch (error) {
    console.error('❌ Erro geral no proxy:', error);
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