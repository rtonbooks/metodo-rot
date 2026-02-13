const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

exports.handler = async function(event){

  // Permitir apenas POST
  if(event.httpMethod !== "POST"){
    return {
      statusCode: 405,
      body: "Método não permitido"
    };
  }

  // Verificar se tem body
  if(!event.body){
    return {
      statusCode: 400,
      body: "Body não enviado"
    };
  }

  const { email } = JSON.parse(event.body);

  if(!email){
    return {
      statusCode: 400,
      body: "Email não informado"
    };
  }

  try {

    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      aluno: true
    });

    return {
      statusCode: 200,
      body: "Admin definido com sucesso"
    };

  } catch(error){
    return {
      statusCode: 500,
      body: "Erro: " + error.message
    };
  }
};