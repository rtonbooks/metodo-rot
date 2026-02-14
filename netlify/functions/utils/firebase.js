// netlify/functions/utils/firebase.js
const admin = require('firebase-admin');

// Inicializa o Firebase Admin com a chave da variável de ambiente
const initializeFirebase = () => {
  try {
    // Verifica se já foi inicializado
    if (admin.apps.length) {
      return admin;
    }

    // Pega a chave da variável de ambiente
    const firebaseKey = process.env.FIREBASE_KEY;
    
    if (!firebaseKey) {
      throw new Error('FIREBASE_KEY não encontrada nas variáveis de ambiente');
    }

    // Parse do JSON (a variável contém o JSON stringificado)
    const serviceAccount = JSON.parse(firebaseKey);

    // Inicializa o app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin inicializado com sucesso');
    return admin;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    throw error;
  }
};

module.exports = initializeFirebase();