# Conta Comigo

> O controle financeiro colaborativo para você organizar suas finanças pessoais ou gerenciar as contas da casa e da família sem atritos.

---

## 🌐 Acesso em Produção

- **URL do Sistema no ar:** [https://cleiton-souza-isw055.lapps.studio](https://cleiton-souza-isw055.lapps.studio)
- **Repositório:** [github.com/cleitongrodrigues/Controle_Financeiro](https://github.com/cleitongrodrigues/Controle_Financeiro)
- **Autor:** [@cleitongrodrigues](https://github.com/cleitongrodrigues)
- **Professor / Disciplina:** [github.com/siriani](https://github.com/siriani) — *ISW055 · Introdução à Computação em Nuvem*

---

### ⚡ Credenciais de Teste Rápido (Senha para todos: `123456`)

| Usuário | E-mail | Papel (RBAC) | Permissões no Sistema |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@contacomigo.com` | `admin` | Acesso completo à auditoria e logs no Redis Streams (`/api/logs`). |
| **Mariana Lopes** | `titular@contacomigo.com` | `titular` | Gestora da conta familiar "Casa Mariana & Lucas": cria despesas, gera convites e gerencia a conta. |
| **Lucas Lopes** | `membro@contacomigo.com` | `membro` | Afiliado convidado: lança despesas e vê saldo conjunto. **Bloqueado (403)** ao tentar excluir conta ou ver logs. |

---

## 🏗️ Diagrama de Arquitetura

O sistema opera sobre uma arquitetura de microsserviços conteinerizada via Docker Compose, com banco relacional MySQL, mensageria Redis Streams e Object Storage MinIO:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Navegador (Web & Mobile)                    │
│   Landing Page Pública / Dashboard Financeiro Responsivo    │
└─────────────────────────────────────────────────────────────┘
                               ↓ HTTPS (porta 8201)
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)                     │
│               Proxy reverso Nginx / Static                  │
└─────────────────────────────────────────────────────────────┘
                               ↓ HTTP
┌──────────────────────────────────────────────┐          ┌─────────────────────────┐
│         Backend Principal (porta 3000)       │ ───────> │  Log Service (porta 3002)│
│  ├─ CRUD de Contas e Transações              │          │  (Apenas interno Docker)│
│  ├─ Multi-Tenancy & Isolamento Seguro        │          │  ├─ Recebe eventos      │
│  ├─ Validação de RBAC (titular/membro/admin) │ <─────── │  └─ Retorna logs (Admin)│
│  └─ Anexo de Comprovantes                    │          └─────────────────────────┘
└──────────────────────────────────────────────┘                        ↓ XADD
         ↓                         ↓                       ┌─────────────────────────┐
┌──────────────────┐      ┌──────────────────┐             │  Redis 7 (porta 6379)   │
│   Auth Service   │      │      MinIO       │             │  └─ Redis Streams       │
│   (porta 3001)   │      │   (porta 9000)   │             └─────────────────────────┘
│  ├─ Login / JWT  │      │  Object Storage  │
│  └─ RBAC & Hash  │      │  ├─ Comprovantes │
└──────────────────┘      │  └─ Fotos Perfil │
         ↓                └──────────────────┘
┌──────────────────────────────────────────────┐
│             Banco MySQL (porta 3306)         │
│  ├─ usuarios, reset_tokens                   │
│  ├─ contas, membros_conta                    │
│  └─ categorias, transacoes                   │
└──────────────────────────────────────────────┘
```

---

## 1. Nome e Frase
**Conta Comigo**: A plataforma de gestão financeira inteligente e responsiva (Web e Mobile) projetada tanto para uso pessoal individual quanto compartilhado (casal, família ou república), permitindo que o gestor convide afiliados via link e consolide despesas com comprovantes e balanço automático.

---

## 2. A Dor
- **Quem sofre:** Casais que moram juntos, chefes de família, estudantes em repúblicas e indivíduos que precisam separar o que é gasto pessoal do que é conta compartilhada da residência.
- **Quando:** Todos os meses, no momento em que chegam as contas de consumo (aluguel, condomínio, luz, internet, compras de supermercado e farmácia) e no fechamento das faturas de cartão.
- **Quanto custa hoje:**
  - **Dinheiro:** Perda média de **R$ 150 a R$ 400 mensais** por despesas duplicadas, esquecimento de datas de vencimento com incidência de multas/juros e falta de previsibilidade do saldo familiar.
  - **Tempo:** Mais de **4 a 6 horas por mês** gastas somando extratos bancários de bancos diferentes, procurando comprovantes soltos em conversas de WhatsApp e preenchendo planilhas.
  - **Risco emocional e atrito:** Discussões frequentes entre parceiros ou familiares por falta de transparência sobre "quem gastou mais", quem pagou a última compra de supermercado ou quanto cada um realmente deve.
- **Como resolvem hoje:** 
  - Grupos de WhatsApp ("Contas de Casa") com prints de PIX e fotos de notas que se perdem no histórico.
  - Planilhas manuais (Google Sheets/Excel) que quebram fórmulas e exigem disciplina difícil de manter no celular.
  - Aplicativos bancários isolados que não conversam entre si e não têm foco em divisão de despesas conjuntas.

---

## 3. Persona
- **Nome:** Mariana Lopes
- **Idade:** 32 anos
- **Ocupação:** Analista de Recursos Humanos
- **Contexto:** Casada com Lucas há 3 anos, mora com o marido e um filho de 4 anos. Ambos trabalham e possuem contas bancárias separadas, mas dividem todas as despesas da casa e da criança.
- **Rotina:** Dia a dia corrido, alternando entre trabalho em home-office híbrido, escola da criança e tarefas do lar. Realiza a maior parte dos pagamentos via PIX ou cartão de crédito pelo celular.
- **O que tenta fazer:** Ter uma visão unificada e em tempo real do custo mensal da residência, saber exatamente quanto cada um contribuiu até o momento e guardar uma reserva previsível para a viagem de férias da família.
- **O que atrapalha:** O marido frequentemente esquece de lançar compras de conveniência ou farmácia; os comprovantes fiscais em papel somem; as planilhas são péssimas para usar pelo smartphone na rua; no final do mês, calcular o acerto de contas vira um motivo de estresse e cobrança entre o casal.

---

## 4. Concorrentes e Alternativas

| Concorrente / Alternativa | O que é | O que faz mal / Ponto fraco |
| :--- | :--- | :--- |
| **Mobills / Organizze** | Aplicativos populares de gestão financeira pessoal. | Foco quase exclusivo no usuário individual. Não possuem sistema nativo de conta conjunta com múltiplos logins e links de convite para afiliados; forçam o casal a compartilhar a mesma senha ou pagar duas assinaturas isoladas. |
| **Planilhas (Google Sheets / Excel)** | Modelos prontos de orçamento doméstico em nuvem. | Péssima usabilidade em telas mobile, alta propensão a erros de digitação e fórmulas quebradas, zero suporte nativo a upload/armazenamento de fotos de comprovantes e ausência de trilha de auditoria em tempo real. |
| **Grupos de WhatsApp ("Contas da Casa") + Bloco de Notas** | Troca de mensagens de texto com fotos de comprovantes e transferências. | Desorganização total: não calcula saldos, não gera relatórios nem gráficos, as fotos expiram no aplicativo e exige somar tudo manualmente na calculadora todo fim de mês. |

---

## 5. Proposta de Valor
> *"A organização de uma conta pessoal com a simplicidade de gerenciar despesas compartilhadas em casal ou família por meio de convites rápidos, controle de permissões, comprovantes centralizados e cálculo de balanço automático."*

---

## 6. Modelo de Receita com Stripe

O **Conta Comigo** opera sob modelo SaaS freemium via assinatura recorrente processada com **Stripe**:

### 🟢 Plano Free (Gratuito)
- Gestão financeira pessoal individual completa;
- Até **1 membro convidado** na conta conjunta (ideal para casais em fase inicial de organização);
- Histórico de transações limitado aos **últimos 3 meses**;
- Até **15 comprovantes anexados por mês** (armazenamento de arquivos no MinIO);
- Categorização essencial de receitas e despesas.

### 🟣 Plano Conta Comigo Pro — R$ 19,90 / mês *(ou R$ 199,00 / ano)*
- **Membros ilimitados** via link de convite (família completa: pais, filhos, dependentes ou integrantes da casa);
- Histórico de lançamentos **ilimitado** com filtros temporais e busca avançada;
- **Upload ilimitado de comprovantes** (PIX, cupons fiscais, boletos e recibos em PDF/imagem);
- **Relatório de Balanço Automatizado:** visualização de *"Quem gastou o quê"* e cálculo de compensação entre os membros da casa;
- Gráficos comparativos por categoria e exportação de dados (CSV / PDF);
- Suporte prioritário.

---

## 7. Métricas de Sucesso
- **Cadastros Ativos (Onboarding):** Usuários que criam a conta e registram ao menos 5 transações nos primeiros 7 dias.
- **Taxa de Convites Aceitos:** Proporção de links de convite gerados que resultam em novos membros cadastrados e ativos no mesmo grupo.
- **MRR (Monthly Recurring Revenue):** Meta de atingir **R$ 3.500,00 a R$ 5.000,00 em MRR** nos primeiros 6 meses de tração.
- **Taxa de Conversão Free → Pro:** Converter entre **5% a 8%** da base ativa para o plano Pro.
- **Retenção e Churn Rate:** Manter o Churn mensal abaixo de **4%**, com engajamento constante na conciliação mensal.

---

## 8. Lean Canvas

| Bloco | Descrição Detalhada |
| :--- | :--- |
| **1. Problema** | • Falta de visibilidade dos gastos totais compartilhados da casa.<br>• Perda de tempo conferindo comprovantes soltos no WhatsApp e extratos bancários distintos.<br>• Brigas e desgastes no casal/família por falta de transparência e sensação de descompasso financeiro. |
| **2. Segmentos de Clientes** | • Casais que moram juntos e dividem despesas.<br>• Famílias que buscam centralizar o orçamento do lar.<br>• Repúblicas universitárias e pessoas que compartilham moradia. |
| **3. Proposta Única de Valor** | Controle financeiro descomplicado: cuide das suas finanças pessoais e convide quem divide a rotina com você para gerenciar as contas da casa com comprovantes e balanço automático. |
| **4. Solução** | 1. Contas individuais e conjuntas com links de convite instantâneos para afiliados.<br>2. Upload e armazenamento de comprovantes fiscais e PIX atrelados a cada lançamento.<br>3. Relatório automatizado de gastos por membro e saldo compartilhado. |
| **5. Canais** | • Marketing de conteúdo orgânico (Instagram, TikTok e YouTube Shorts com dicas de finanças para casais).<br>• Mecanismo de crescimento viral interno (o usuário principal convida o parceiro/família para a plataforma).<br>• Comunidades de universitários e fóruns de organização pessoal. |
| **6. Fontes de Receita** | • Assinatura mensal do Plano Pro (R$ 19,90/mês via Stripe).<br>• Assinatura anual do Plano Pro com desconto (R$ 199,00/ano via Stripe). |
| **7. Estrutura de Custos** | • Custos de infraestrutura de nuvem (servidor Docker / Portainer).<br>• Taxas de intermediação do Stripe (3,99% + R$ 0,39 por cobrança aprovada).<br>• Armazenamento em Object Storage (MinIO / S3 compatível). |
| **8. Métricas-Chave** | • Usuários Ativos Mensais (MAU).<br>• Volume de transações registradas por mês.<br>• Taxa de conversão para o Plano Pro.<br>• Churn rate mensal. |
| **9. Vantagem Injusta** | Experiência de onboarding focada em colaboração instantânea via link de convite, interface limpa para mobile/web e conciliação visual rápida com anexo de comprovantes sem a complexidade dos ERPs bancários tradicionais. |

---

## 9. Mapa de Reaproveitamento da Arquitetura

| Peça do Projeto Anterior | O que vira no Conta Comigo | Implementação Técnica |
| :--- | :--- | :--- |
| **Catálogo de Filmes (TMDB API)** | **Módulo Financeiro Central** | CRUD completo de transações (receitas, despesas, transferências), categorias financeiras (Moradia, Alimentação, Transporte, Lazer) e cálculo de saldos consolidados. |
| **Auth-Service + RBAC** | **Gestão de Acesso e Afiliados** | Papel de `Titular / Administrador` (gerencia conta, convida afiliados, altera tetos de gastos e assina o Pro) e `Membro / Afiliado` (lança despesas, visualiza saldo compartilhado e anexa comprovantes). Autenticação JWT e fluxo seguro de esqueci minha senha via e-mail. |
| **Upload e Perfil (MinIO / S3)** | **Comprovantes e Recibos Fiscais** | Upload de fotos de notas fiscais, cupons de supermercado, recibos e comprovantes de PIX atrelados diretamente a cada transação financeira, além da foto de perfil dos membros. |
| **Log-Service (Redis Streams)** | **Trilha de Auditoria Financeira** | Registro em tempo real de eventos críticos do negócio: *"transacao_criada"*, *"transacao_editada"*, *"comprovante_anexado"*, *"entrou_na_conta"*, garantindo total transparência e confiabilidade. |
| **Plano Premium (Stripe)** | **Monetização e Cobrança do SaaS** | Checkout Stripe para contratação da assinatura Pro Família, gerenciamento de ciclo de vida da assinatura via Webhooks e desbloqueio de recursos avançados. |
| **Frontend (React + Vite)** | **Interface Responsiva (Web & Mobile)** | Landing Page pública aberta, Dashboard financeiro moderno, visualização de extrato, modal de lançamento rápido de despesa com envio de foto e gráficos de despesas por categoria e por pessoa. |
| **Docker Compose & Portainer** | **Orquestração de Microsserviços** | A mesma infraestrutura com isolamento de rede, containers dedicados para frontend, backend, auth-service, log-service, redis, minio e MySQL. |

---

## 10. Scripts de Banco de Dados (MySQL)

Os scripts de criação e semeadura do banco de dados estão versionados no repositório:
- **Migração das Tabelas do Domínio:** [`migrations/003-dominio-conta-comigo.sql`](file:///c:/Users/Cleiton/Documents/GitHub/Controle_Financeiro/migrations/003-dominio-conta-comigo.sql)
- **Seed de Dados Demonstrativos:** [`migrations/004-seed-dados.sql`](file:///c:/Users/Cleiton/Documents/GitHub/Controle_Financeiro/migrations/004-seed-dados.sql)
- **Migração da Atividade 11 (Stripe & Assinaturas):** [`migrations/005-add-stripe-subscriptions.sql`](file:///c:/Users/Cleiton/Documents/GitHub/Controle_Financeiro/migrations/005-add-stripe-subscriptions.sql)

---

## 11. Atividade 11 — SaaS Completo: Assinaturas Recorrentes com Stripe

O **Conta Comigo** agora opera como um SaaS completo integrado ao **Stripe** em modo de teste:

### 1. Planos e Preços
- **Plano Free (R$ 0,00):** Limite de **5 lançamentos de transações por mês**.
- **Plano Pro (R$ 19,90/mês):** Transações ilimitadas, comprovantes fiscais ilimitados no MinIO e múltiplos afiliados.

### 2. Ciclo de Vida da Assinatura via Webhooks
A assinatura é mantida em tempo real pelos **Webhooks do Stripe**, garantindo idempotência e tratamento contra eventos duplicados (tabela `stripe_events`):
| Evento | Ação no Sistema | Efeito no Banco de Dados |
| :--- | :--- | :--- |
| `checkout.session.completed` | Cliente conclui checkout com cartão de teste | Promove usuário para `plano = 'pro'`, salva `stripe_customer_id` e `stripe_subscription_id`. |
| `customer.subscription.updated` | Troca de plano, renovação ou status alterado | Atualiza status (`active`, `past_due`, `canceled`) e plano correspondente. |
| `customer.subscription.deleted` | Cancelamento da assinatura | Rebaixa o usuário imediatamente para o `plano = 'free'`. |
| `invoice.payment_failed` | Falha na renovação do cartão | Marca `past_due` e revoga privilégios Pro. |

### 3. Portal do Cliente (Stripe Billing Portal)
- O usuário Pro conta com o botão **"⭐ PRO (Gerenciar)"** no cabeçalho do Dashboard, abrindo a sessão do **Customer Portal** do Stripe para trocar de cartão, visualizar faturas ou cancelar a assinatura a qualquer momento.

### 4. Validação de Limites na API (Backend)
- A cada tentativa de criação de transação (`POST /api/transacoes`), o backend verifica o plano ativo e a quantidade de transações cadastradas no mês atual.
- Ao atingir **5 transações no Free**, a API bloqueia a requisição retornando **HTTP 403 Forbidden** com detalhes e modal convidando para o upgrade.

### 5. Painel Administrativo de Negócio (Admin)
- Acessível na rota `/logs` exclusivamente pelo papel `admin` (`admin@contacomigo.com`):
  - **Usuários Cadastrados por Plano:** Total e detalhamento Free vs Pro.
  - **Assinaturas Ativas:** Quantidade de clientes pagantes ativos.
  - **MRR de Teste (Monthly Recurring Revenue):** Cálculo em tempo real do faturamento mensal recorrente (`R$ 19,90 × Assinaturas Ativas`).
  - **Trilha de Auditoria:** Eventos do Stripe e do negócio persistidos via **Redis Streams**.

---

## 12. Como Executar Localmente ou no Portainer

### Configuração das Variáveis de Ambiente no Portainer:
No painel do Portainer (Stack `filmes-do-cleitin`), defina as variáveis de ambiente:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
```

### Execução Local com Docker Compose:
```bash
# 1. Clone o repositório
git clone https://github.com/cleitongrodrigues/Controle_Financeiro.git
cd Controle_Financeiro

# 2. Configure o arquivo de ambiente
cp .env.example .env

# 3. Suba os containers
docker compose up -d --build
```

Os serviços ficarão disponíveis em:
- **Frontend Web:** `http://localhost:8201`
- **Backend API:** `http://localhost:3000`
- **MinIO S3 Endpoint:** `http://localhost:9000` (interno Docker)