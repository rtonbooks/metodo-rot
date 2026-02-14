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
    // TENTAR CRIAR PERFIL (OU OBTER ID SE JÁ EXISTIR)
    // ============================================
    const profileUrl = 'https://a.klaviyo.com/api/profiles/';
    
    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email: email,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || ''
        }
      }
    };

    console.log('Tentando criar/atualizar perfil:', JSON.stringify(profileData, null, 2));

    let profileId = null;
    
    const profileResponse = await fetch(profileUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(profileData)
    });

    const profileResponseData = await profileResponse.json();
    console.log('Resposta do perfil:', JSON.stringify(profileResponseData, null, 2));

    if (profileResponse.ok) {
      // Perfil criado com sucesso
      profileId = profileResponseData.data.id;
      console.log('Novo perfil criado com ID:', profileId);
    } 
    else if (profileResponse.status === 409) {
      // Perfil já existe - extrair ID do erro
      const duplicateProfileId = profileResponseData.errors[0].meta.duplicate_profile_id;
      profileId = duplicateProfileId;
      console.log('Perfil já existe. Usando ID existente:', profileId);
    }
    else {
      // Outro erro
      return {
        statusCode: profileResponse.status,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: JSON.stringify(profileResponseData)
        })
      };
    }

    // ============================================
    // VERIFICAR SE O PERFIL JÁ ESTÁ NA LISTA
    // ============================================
    if (profileId) {
      // Adicionar o perfil à lista (se já estiver, a API ignora)
      const subscriptionUrl = `https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`;

      const subscriptionData = {
        data: [{
          type: 'profile',
          id: profileId
        }]
      };

      console.log('Adicionando perfil à lista:', JSON.stringify(subscriptionData, null, 2));

      const subscriptionResponse = await fetch(subscriptionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify(subscriptionData)
      });

      const subscriptionResponseData = await subscriptionResponse.text();
      console.log('Resposta da assinatura:', subscriptionResponseData);

      if (subscriptionResponse.ok || subscriptionResponse.status === 409) {
        // 409 também é aceitável (já estava na lista)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      } else {
        return {
          statusCode: subscriptionResponse.status,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: subscriptionResponseData 
          })
        };
      }
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