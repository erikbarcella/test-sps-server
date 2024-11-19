const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.error('Erro na conexão com o Redis:', err);
});

client.on('connect', async () => {
  console.log('Conectado ao Redis com sucesso.');

  try {
    const email = 'admin@spsgroup.com.br';

    // Verificar se o usuário já existe no Redis
    const exists = await client.hExists('users', email);
    
    if (exists) {
      // console.log('Usuário já existe.');
    } else {
      // Usando o email como chave no Redis
      await client.hSet(
        'users',
        email,  // chave é o email
        JSON.stringify({
          name: 'admin',
          email: email,
          type: 'admin',
          password: '1234',
        })
      );
      console.log('Usuário admin criado com sucesso.');
    }
  } catch (err) {
    console.error('Erro ao adicionar admin:', err);
  }
});


client.connect().catch((err) => console.error('Erro ao conectar ao Redis:', err));

module.exports = client;
