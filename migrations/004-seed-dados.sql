-- ====================================================================
-- Seed de Dados Iniciais: Conta Comigo (Controle Financeiro)
-- Banco de Dados: MySQL
-- Usuários pré-cadastrados (senha para todos: 123456):
-- 1. admin@contacomigo.com   (Papel: admin)
-- 2. titular@contacomigo.com (Papel: titular - Mariana Lopes)
-- 3. membro@contacomigo.com  (Papel: membro - Lucas Lopes)
-- ====================================================================

-- 1. Categorias Padrão
INSERT IGNORE INTO categorias (id, nome, tipo, icone, cor) VALUES
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

-- 2. Usuários de Demonstração
-- Hash bcrypt para '123456'
INSERT INTO usuarios (nome, email, senha_hash, role, bio) VALUES
('Administrador do Sistema', 'admin@contacomigo.com', '$2a$10$5srQxzw5HMmeBxXOjP8qdOEpJM75O6tUDJMIAYmzKQkeiJPY5dCX6', 'admin', 'Administrador geral da infraestrutura e auditoria.'),
('Mariana Lopes (Titular)', 'titular@contacomigo.com', '$2a$10$5srQxzw5HMmeBxXOjP8qdOEpJM75O6tUDJMIAYmzKQkeiJPY5dCX6', 'titular', 'Gestora da conta familiar e orçamento da residência.'),
('Lucas Lopes (Membro)', 'membro@contacomigo.com', '$2a$10$5srQxzw5HMmeBxXOjP8qdOEpJM75O6tUDJMIAYmzKQkeiJPY5dCX6', 'membro', 'Membro da família, compartilhando despesas da casa.')
ON DUPLICATE KEY UPDATE 
  nome=VALUES(nome), 
  senha_hash=VALUES(senha_hash), 
  role=VALUES(role),
  bio=VALUES(bio);

-- 3. Conta Conjunta de Demonstração
INSERT INTO contas (nome, tipo, saldo, criador_id, codigo_convite)
SELECT 'Casa & Família (Mariana e Lucas)', 'conjunta', 4250.00, u.id, 'CASA-FAMILIA-2026'
FROM usuarios u WHERE u.email = 'titular@contacomigo.com'
LIMIT 1
ON DUPLICATE KEY UPDATE nome=VALUES(nome), tipo=VALUES(tipo), saldo=VALUES(saldo);

-- 4. Associação de Membros
INSERT IGNORE INTO membros_conta (conta_id, usuario_id, papel)
SELECT c.id, u.id, 'titular'
FROM contas c, usuarios u
WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'titular@contacomigo.com';

INSERT IGNORE INTO membros_conta (conta_id, usuario_id, papel)
SELECT c.id, u.id, 'membro'
FROM contas c, usuarios u
WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'membro@contacomigo.com';

-- 5. Transações Iniciais
INSERT INTO transacoes (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status)
SELECT c.id, u.id, 8, 'receita', 'Salário Mensal Mariana', 5500.00, CURDATE(), 'Depósito do salário para composição do orçamento da casa.', 'pago'
FROM contas c, usuarios u WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'titular@contacomigo.com' LIMIT 1;

INSERT INTO transacoes (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status)
SELECT c.id, u.id, 8, 'receita', 'Salário Mensal Lucas', 4800.00, CURDATE(), 'Depósito da parte do Lucas para as contas da casa.', 'pago'
FROM contas c, usuarios u WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'membro@contacomigo.com' LIMIT 1;

INSERT INTO transacoes (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status)
SELECT c.id, u.id, 1, 'despesa', 'Aluguel do Apartamento', 2200.00, CURDATE(), 'Pagamento mensal do aluguel e taxa condominial.', 'pago'
FROM contas c, usuarios u WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'titular@contacomigo.com' LIMIT 1;

INSERT INTO transacoes (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status)
SELECT c.id, u.id, 2, 'despesa', 'Supermercado Mensal', 850.40, CURDATE(), 'Compras de abastecimento para o mês todo.', 'pago'
FROM contas c, usuarios u WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'membro@contacomigo.com' LIMIT 1;

INSERT INTO transacoes (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status)
SELECT c.id, u.id, 7, 'despesa', 'Internet Fibra 500MB', 129.90, CURDATE(), 'Conta de internet fixa residencial.', 'pago'
FROM contas c, usuarios u WHERE c.codigo_convite = 'CASA-FAMILIA-2026' AND u.email = 'titular@contacomigo.com' LIMIT 1;
