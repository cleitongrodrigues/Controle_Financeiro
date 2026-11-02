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
});

async function initDatabase() {
  const connection = await pool.getConnection();
  const dbName = process.env.DB_NAME || 'conta_comigo';

  try {
    // 1. Tabela de Usuários com papéis do negócio: 'admin', 'titular', 'membro'
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'",
      [dbName]
    );

    if (tables.length === 0) {
      console.log('Criando tabela usuarios...');
      await connection.query(`
        CREATE TABLE usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'titular',
          bio VARCHAR(255) DEFAULT NULL,
          foto_perfil VARCHAR(255) DEFAULT NULL,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      const [roleColumns] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'role'",
        [dbName]
      );
      if (roleColumns.length === 0) {
        await connection.query("ALTER TABLE usuarios ADD COLUMN role VARCHAR(50) DEFAULT 'titular'");
      }

      const [bioColumns] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'bio'",
        [dbName]
      );
      if (bioColumns.length === 0) {
        await connection.query("ALTER TABLE usuarios ADD COLUMN bio VARCHAR(255) DEFAULT NULL");
      }

      const [fotoColumns] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_perfil'",
        [dbName]
      );
      if (fotoColumns.length === 0) {
        await connection.query("ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL");
      }
    }

    // 2. Tabela de Reset Tokens
    const [resetTokens] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reset_tokens'",
      [dbName]
    );

    if (resetTokens.length === 0) {
      console.log('Criando tabela reset_tokens...');
      await connection.query(`
        CREATE TABLE reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(255) UNIQUE NOT NULL,
          usuario_id INT NOT NULL,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expira_em TIMESTAMP NOT NULL,
          usado BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // 3. Inserir usuários padrão de teste caso não existam
    // Senha padrão para todos: 123456
    const defaultPasswordHash = '$2a$10$5srQxzw5HMmeBxXOjP8qdOEpJM75O6tUDJMIAYmzKQkeiJPY5dCX6';
    
    await connection.query(`
      INSERT INTO usuarios (id, nome, email, senha_hash, role, bio) VALUES
      (1, 'Administrador do Sistema', 'admin@contacomigo.com', '${defaultPasswordHash}', 'admin', 'Administrador da plataforma Conta Comigo'),
      (2, 'Mariana Lopes (Titular)', 'titular@contacomigo.com', '${defaultPasswordHash}', 'titular', 'Gestora da conta familiar e orçamento'),
      (3, 'Lucas Lopes (Membro)', 'membro@contacomigo.com', '${defaultPasswordHash}', 'membro', 'Membro da família e contribuinte')
      ON DUPLICATE KEY UPDATE role = VALUES(role), bio = VALUES(bio)
    `);

    console.log('✓ Estrutura de usuários e autenticação pronta');
  } catch (err) {
    console.error('Erro ao inicializar banco no auth-service:', err.message);
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query: async (sql, values) => {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      connection.release();
    }
  },
  initDatabase,
};
