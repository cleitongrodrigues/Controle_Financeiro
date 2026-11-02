const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cine_magico',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // Verificar se tabela 'usuarios' existe
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'",
      [process.env.DB_NAME || 'cine_magico']
    );

    if (tables.length === 0) {
      console.log('Creating usuarios table...');
      await connection.query(`
        CREATE TABLE usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'usuario',
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      const [roleColumns] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'role'",
        [process.env.DB_NAME || 'cine_magico']
      );

      if (roleColumns.length === 0) {
        await connection.query("ALTER TABLE usuarios ADD COLUMN role VARCHAR(50) DEFAULT 'usuario'");
      }

      const [passwordColumns] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME IN ('senha', 'senha_hash')",
        [process.env.DB_NAME || 'cine_magico']
      );
      const passwordColumnNames = passwordColumns.map((column) => column.COLUMN_NAME);

      if (!passwordColumnNames.includes('senha_hash')) {
        await connection.query("ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(255) NULL");

        if (passwordColumnNames.includes('senha')) {
          await connection.query(
            'UPDATE usuarios SET senha_hash = senha WHERE senha_hash IS NULL AND senha IS NOT NULL'
          );
          await connection.query("ALTER TABLE usuarios MODIFY COLUMN senha VARCHAR(255) NULL");
        }
      }
    }

    // Verificar se tabela 'reset_tokens' existe
    const [resetTokens] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reset_tokens'",
      [process.env.DB_NAME || 'cine_magico']
    );

    if (resetTokens.length === 0) {
      console.log('Creating reset_tokens table...');
      await connection.query(`
        CREATE TABLE reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(255) UNIQUE NOT NULL,
          usuario_id INT NOT NULL,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expira_em TIMESTAMP NOT NULL,
          usado BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
      `);
    }
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
