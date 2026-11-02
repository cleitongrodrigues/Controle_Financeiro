-- ====================================================================
-- Migração do Domínio: Conta Comigo (Controle Financeiro)
-- Banco de Dados: MySQL
-- Substituição do catálogo de filmes pelo domínio de controle financeiro
-- ====================================================================

-- 1. Remoção segura das tabelas antigas de filmes, se existirem
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS favoritos;

-- 2. Atualizar ou garantir a tabela de usuários
-- Papéis do negócio: 'admin', 'titular', 'membro'
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'titular',
  bio VARCHAR(255) DEFAULT NULL,
  foto_perfil VARCHAR(255) DEFAULT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garantir coluna role e fotos caso a tabela usuarios já exista
ALTER TABLE usuarios MODIFY COLUMN role VARCHAR(50) DEFAULT 'titular';

-- 3. Tabela de Contas Financeiras (Pessoal ou Conjunta)
CREATE TABLE IF NOT EXISTS contas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('pessoal', 'conjunta') NOT NULL DEFAULT 'pessoal',
  saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  criador_id INT NOT NULL,
  codigo_convite VARCHAR(64) UNIQUE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Associação de Membros às Contas (Multi-tenancy e Colaboração)
-- Papéis na conta: 'titular' (administrador da conta) e 'membro' (afiliado convidado)
CREATE TABLE IF NOT EXISTS membros_conta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NOT NULL,
  usuario_id INT NOT NULL,
  papel ENUM('titular', 'membro') NOT NULL DEFAULT 'membro',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conta_usuario (conta_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela de Categorias Financeiras
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  tipo ENUM('despesa', 'receita') NOT NULL,
  icone VARCHAR(50) NOT NULL DEFAULT 'tag',
  cor VARCHAR(20) NOT NULL DEFAULT '#6366F1',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela Principal de Transações (Receitas e Despesas)
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
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de consulta e isolamento por conta
CREATE INDEX idx_transacoes_conta ON transacoes(conta_id);
CREATE INDEX idx_transacoes_usuario ON transacoes(usuario_id);
CREATE INDEX idx_transacoes_data ON transacoes(data_transacao);
CREATE INDEX idx_membros_usuario ON membros_conta(usuario_id);
