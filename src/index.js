const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const client = require('./redisClient'); // Arquivo do Redis
const authenticate = require('./middlware/authenticate'); // Middleware
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: '*', // Permite qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

// Gerar Token JWT
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).send('E-mail e senha são obrigatórios.');

    // Usando o email diretamente como chave
    const user = await client.hGet('users', email);  // email como chave para o hash
    if (!user) return res.status(401).send('Usuário não encontrado.');

    const userData = JSON.parse(user);
    if (userData.password !== password) {
      return res.status(401).send('Senha incorreta.');
    }

    const token = jwt.sign({ email, type: userData.type }, 'mySecret', { expiresIn: '1h' });
    res.json({ token, user: { email, name: userData.name, type: userData.type } });
  } catch (err) {
    next(err);
  }
});

// Adicionar usuário
app.post('/users', authenticate, async (req, res) => {
  try {
    const { email, name, type, password } = req.body;
    if(!email || !name || !type || !password) return res.status(400).send(`os campos 'email', 'name', 'type' e 'password' são obrigatórios.`);
    const user = await client.hGet('users', email);
    if (user) return res.status(400).send('E-mail já cadastrado.');

    await client.hSet('users', email, JSON.stringify({ name, email, type, password }));
    res.status(201).send('Usuário cadastrado com sucesso.');
  } catch (err) {
    next(err);
  }
});

// Remover usuário
app.delete('/users/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).send('E-mail é obrigatório.');
    const response = await client.hDel('users', email);
    if (response === 0) return res.status(404).send('Usuário não encontrado.');

    res.send('Usuário removido com sucesso.');
  } catch (err) {
    next(err);
  }
});

// Alterar dados do usuário
app.put('/users/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    const { name, type, password } = req.body;
    if (!email) return res.status(400).send('E-mail é obrigatório.');
    const user = await client.hGet('users', email);
    if (!user) return res.status(404).send('Usuário não encontrado.');

    const updatedUser = JSON.stringify({ ...JSON.parse(user), name, type, password });

    await client.hSet('users', email, updatedUser);
    res.send('Usuário atualizado com sucesso.');
  } catch (err) {
    next(err);
  }
});

// Obter lista de usuários (somente para teste)
app.get('/users', authenticate, async (req, res) => {
  try {
    const users = await client.hGetAll('users');
    res.json(Object.values(users).map(JSON.parse));
  } catch (err) {
    next(err);
  }
});

// Middleware para tratar erros
app.use((err, req, res, next) => {
  console.error(err); // Logar o erro detalhado no console para debug
  res.status(500).send('Ocorreu um erro interno. Tente novamente mais tarde.');
});

// Inicializar o servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
