require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
app.use(cors());
app.use(express.json());

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const STREAM_KEY = 'cine_magico_audit_logs';

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

app.post('/api/logs', async (req, res) => {
  try {
    const { usuario_id, acao, detalhes } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // XADD stream_key * field1 value1 field2 value2 ...
    // '*' means Redis will generate the ID automatically (timestamp-based)
    await redisClient.xAdd(STREAM_KEY, '*', {
      usuario_id: String(usuario_id || 'anonymous'),
      acao: String(acao),
      detalhes: JSON.stringify(detalhes || {}),
      ip: String(ip),
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao gravar log:', error);
    res.status(500).json({ error: 'Erro interno ao gravar log' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const count = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    
    // XRANGE stream_key - + COUNT count
    // '-' means minimum ID, '+' means maximum ID
    const results = await redisClient.xRange(STREAM_KEY, '-', '+', {
      COUNT: count
    });
    
    // Format the results
    const logs = results.map(entry => {
      return {
        id: entry.id, // Redis stream ID
        ...entry.message
      };
    }).reverse(); // Most recent first
    
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno ao buscar logs' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'log-service' });
});

const PORT = process.env.LOG_SERVICE_PORT || 3002;

async function startServer() {
  try {
    await redisClient.connect();
    console.log('✓ Conectado ao Redis');
    
    app.listen(PORT, () => {
      console.log(`✓ Log Service rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('✗ Erro ao iniciar Log Service:', error);
    process.exit(1);
  }
}

startServer();
