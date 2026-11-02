-- Migrations para separação de autenticação em microsserviço
-- Executar este arquivo no banco de dados cine_magico antes de rodar os containers

-- 1. Criar tabela de usuários com role
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'usuario',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de tokens de reset de senha
CREATE TABLE IF NOT EXISTS reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  usuario_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_usuario_id ON reset_tokens(usuario_id);

-- 4. Se a tabela usuarios já existia (da atividade anterior), adicionar coluna role se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'usuario';

-- 5. Se a tabela antiga ainda tiver a coluna senha, crie senha_hash e migre os hashes:
-- ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(255) NULL;
-- UPDATE usuarios SET senha_hash = senha WHERE senha_hash IS NULL AND senha IS NOT NULL;
-- ALTER TABLE usuarios MODIFY COLUMN senha VARCHAR(255) NULL;
