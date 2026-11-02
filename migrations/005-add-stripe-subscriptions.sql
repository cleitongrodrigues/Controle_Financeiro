-- ====================================================================
-- Migração: Atividade 11 - Assinatura Recorrente SaaS com Stripe
-- Banco de Dados: MySQL
-- Adiciona suporte a planos (Free e Pro), status de assinatura e
-- idempotência de webhooks do Stripe
-- ====================================================================

-- 1. Adicionar colunas de plano e Stripe na tabela de usuários
ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS plano VARCHAR(20) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_price_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP NULL DEFAULT NULL;

-- 2. Índices para buscas rápidas por Customer ID e Subscription ID
CREATE INDEX IF NOT EXISTS idx_usuarios_stripe_customer ON usuarios(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_stripe_subscription ON usuarios(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_plano ON usuarios(plano);

-- 3. Tabela de Idempotência para Webhooks do Stripe
-- Evita processamento duplicado quando o Stripe reenvia o mesmo evento
CREATE TABLE IF NOT EXISTS stripe_events (
  id VARCHAR(255) PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
