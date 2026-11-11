const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'conta_comigo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: 'Z'
});

async function initDatabase() {
  const connection = await pool.getConnection();

  try {
    // 1. Tabela de Contas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        tipo ENUM('pessoal', 'conjunta') NOT NULL DEFAULT 'pessoal',
        saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        criador_id INT NOT NULL,
        codigo_convite VARCHAR(64) UNIQUE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabela de Membros da Conta
    await connection.query(`
      CREATE TABLE IF NOT EXISTS membros_conta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conta_id INT NOT NULL,
        usuario_id INT NOT NULL,
        papel ENUM('titular', 'membro') NOT NULL DEFAULT 'membro',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_conta_usuario (conta_id, usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabela de Categorias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(50) NOT NULL,
        tipo ENUM('despesa', 'receita') NOT NULL,
        icone VARCHAR(50) NOT NULL DEFAULT 'tag',
        cor VARCHAR(20) NOT NULL DEFAULT '#6366F1',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabela de Transações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conta_id INT NOT NULL,
        usuario_id INT NOT NULL,
        categoria_id INT NULL,
        tipo ENUM('despesa', 'receita') NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data_transacao DATE NOT NULL,
        descricao TEXT NULL,
        comprovante_url VARCHAR(255) NULL,
        comprovante_nome VARCHAR(255) NULL,
        status ENUM('pago', 'pendente') NOT NULL DEFAULT 'pago',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Garantir Categorias Padrão
    const [cats] = await connection.query('SELECT COUNT(*) as total FROM categorias');
    if (cats[0].total === 0) {
      await connection.query(`
        INSERT INTO categorias (id, nome, tipo, icone, cor) VALUES
        (1, 'Moradia & Aluguel', 'despesa', 'home', '#EF4444'),
        (2, 'Alimentação & Mercado', 'despesa', 'shopping-cart', '#F59E0B'),
        (3, 'Transporte & Combustível', 'despesa', 'truck', '#3B82F6'),
        (4, 'Saúde & Farmácia', 'despesa', 'activity', '#10B981'),
        (5, 'Lazer & Restaurantes', 'despesa', 'coffee', '#EC4899'),
        (6, 'Educação & Cursos', 'despesa', 'book', '#8B5CF6'),
        (7, 'Contas Fixas (Luz/Água/Net)', 'despesa', 'file-text', '#6366F1'),
        (8, 'Salário & Remuneração', 'receita', 'dollar-sign', '#10B981'),
        (9, 'Rendimentos & Investimentos', 'receita', 'trending-up', '#059669'),
        (10, 'Trabalho Extra / Freelance', 'receita', 'briefcase', '#14B8A6');
      `);
      console.log('✓ Categorias padrão inseridas no banco.');
    }

    // 6. Tabela de Idempotência do Stripe e Colunas de Assinatura (Atividade 11)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stripe_events (
        id VARCHAR(255) PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Garantir colunas de plano e Stripe na tabela usuarios
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'plano'
    `);
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE usuarios 
          ADD COLUMN plano VARCHAR(20) NOT NULL DEFAULT 'free',
          ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL,
          ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL,
          ADD COLUMN subscription_status VARCHAR(50) DEFAULT NULL,
          ADD COLUMN subscription_price_id VARCHAR(255) DEFAULT NULL,
          ADD COLUMN subscription_current_period_end TIMESTAMP NULL DEFAULT NULL;
      `);
      console.log('✓ Colunas de assinatura Stripe adicionadas na tabela usuarios.');
    }

    console.log('✓ Estruturas do domínio Conta Comigo prontas no MySQL.');
  } catch (error) {
    console.error('Erro ao inicializar estruturas no backend:', error.message);
  } finally {
    connection.release();
  }
}

async function query(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  initDatabase
};
