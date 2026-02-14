const admin = require('./utils/firebase');

const ADMIN_PRODUCT_IDS = ['PRODUTO_PLUS_ID'];

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
    const webhookData = JSON.parse(event.body || '{}');
    
    if (!webhookData.data || !webhookData.data.buyer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payload inválido' })
      };
    }

    const buyer = webhookData.data.buyer;
    const product = webhookData.data.product;
    const transaction = webhookData.data.transaction;

    const email = buyer.email;
    const name = buyer.name || 'Usuário Hotmart';
    const phone = buyer.phone || '';
    const productId = product.id;
    const transactionStatus = transaction.status;

    if (transactionStatus !== 'approved' && transactionStatus !== 'completed') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Transação ignorada' })
      };
    }

    const shouldBeAdmin = ADMIN_PRODUCT_IDS.includes(productId.toString());

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      if (shouldBeAdmin) {
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
      }

      await admin.firestore().collection('users').doc(userRecord.uid).set({
        email, name, phone, productId,
        isAdmin: shouldBeAdmin,
        lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: transaction.id,
        transactionStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        const userRecord = await admin.auth().createUser({
          email,
          password: Math.random().toString(36).slice(-12),
          displayName: name,
          phoneNumber: phone
        });

        if (shouldBeAdmin) {
          await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        }

        await admin.firestore().collection('users').doc(userRecord.uid).set({
          email, name, phone, productId,
          isAdmin: shouldBeAdmin,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
          transactionId: transaction.id,
          transactionStatus
        });
      } else {
        throw authError;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Webhook processado' })
    };

  } catch (error) {
    console.error('Erro no webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno', details: error.message })
    };
  }
};