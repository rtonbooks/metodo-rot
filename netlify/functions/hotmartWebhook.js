const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

exports.handler = async function(event){

  const data = JSON.parse(event.body);

  if(data.event === "PURCHASE_APPROVED"){

    const email = data.data.buyer.email;

    const user = await admin.auth().createUser({
      email: email,
      password: "SenhaTemporaria123"
    });

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false,
      aluno: true
    });

    await admin.firestore().collection("usuarios").doc(user.uid).set({
      email: email,
      plano: "Premium",
      status: "ativo",
      criadoEm: new Date()
    });
  }

  return {
    statusCode: 200,
    body: "ok"
  };
};