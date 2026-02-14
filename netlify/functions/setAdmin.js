const admin = require('./utils/firebase');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, makeAdmin } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email é obrigatório' })
      };
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: makeAdmin === true });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Usuário ${email} atualizado com admin=${makeAdmin === true}`,
        uid: user.uid
      })
    };

  } catch (error) {
    console.error('Erro no setAdmin:', error);
    
    if (error.code === 'auth/user-not-found') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno', details: error.message })
    };
  }
};