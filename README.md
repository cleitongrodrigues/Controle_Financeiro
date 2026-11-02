# Conta Comigo

> O controle financeiro colaborativo para você organizar suas finanças pessoais ou gerenciar as contas da casa e da família sem atritos.

---

## Desenvolvido por
- **Autor:** [@cleitongrodrigues](https://github.com/cleitongrodrigues)
- **Repositório:** [github.com/cleitongrodrigues/Controle_Financeiro](https://github.com/cleitongrodrigues/Controle_Financeiro)
- **Professor / Disciplina:** [github.com/siriani](https://github.com/siriani) — *ISW055 · Introdução à Computação em Nuvem*

---

## 1. Nome e Frase
**Conta Comigo**: A plataforma de gestão financeira inteligente e responsiva (Web e Mobile) projetada tanto para uso pessoal individual quanto compartilhado (casal, família ou república), permitindo que o gestor convide afiliados via link e consolide despesas com comprovantes e balanço automático.

---

## 2. A Dor
- **Quem sofre:** Casais que moram juntos, chefes de família, estudantes em repúblicas e indivíduos que precisam separar o que é gasto pessoal do que é conta compartilhada da residência.
- **Quando:** Todos os meses, no momento em que chegam as contas de consumo (aluguel, condomínio, luz, internet, compras de supermercado e farmácia) e no fechamento das faturas de cartão.
- **Quanto custa hoje:**
  - **Dinheiro:** Perda média de **R$ 150 a R$ 400 mensais** por despesas duplicadas, esquecimento de datas de vencimento com incidência de multas/juros e falta de previsibilidade do saldo familiar.
  - **Tempo:** Mais de **4 a 6 horas por mês** gastas somando extratos bancários de bancos diferentes, procurando comprovantes soltos em conversas de WhatsApp e tentando preencher planilhas.
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
- **Contexto:** Casada com Lucas há 3 anos, mora com o marido e um filho de 4 anos. Ambos trabalham e possuem contas bancárias separadas (Nubank e Itaú), mas dividem todas as despesas da casa e da criança.
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
- **Cadastros Ativos (Onboarding):** Número de usuários que criam a conta e registram ao menos 5 transações nos primeiros 7 dias.
- **Taxa de Convites Aceitos:** Proporção de links de convite gerados que resultam em novos membros cadastrados e ativos no mesmo grupo.
- **MRR (Monthly Recurring Revenue):** Meta de atingir **R$ 3.500,00 a R$ 5.000,00 em MRR** nos primeiros 6 meses de tração.
- **Taxa de Conversão Free → Pro:** Converter entre **5% a 8%** da base ativa para o plano Pro, impulsionada pelo limite de membros e necessidade de histórico contínuo.
- **Retenção e Churn Rate:** Manter o Churn mensal abaixo de **4%**, com alto engajamento no fechamento e na virada de cada mês.

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

Toda a arquitetura robusta de microsserviços desenvolvida até aqui é 100% reaproveitada para sustentar o **Conta Comigo**:

| Peça do Projeto Anterior | O que vira no Conta Comigo | Implementação Técnica |
| :--- | :--- | :--- |
| **Catálogo de Filmes (TMDB API)** | **Módulo Financeiro Central** | CRUD completo de transações (receitas, despesas, transferências), categorias financeiras (Moradia, Alimentação, Transporte, Lazer) e cálculo de saldos consolidados. |
| **Auth-Service + RBAC** | **Gestão de Acesso e Afiliados** | Papel de `Titular / Administrador` (gerencia conta, convida afiliados, altera tetos de gastos e assina o Pro) e `Membro / Afiliado` (lança despesas, visualiza saldo compartilhado e anexa comprovantes). Autenticação JWT e fluxo seguro de esqueci minha senha via e-mail. |
| **Upload e Perfil (MinIO / S3)** | **Comprovantes e Recibos Fiscais** | Upload de fotos de notas fiscais, cupons de supermercado, recibos e comprovantes de PIX atrelados diretamente a cada transação financeira, além da foto de perfil dos membros. |
| **Log-Service (Redis Streams)** | **Trilha de Auditoria Financeira** | Registro em tempo real de eventos críticos do negócio: *"Transação criada por Lucas (R$ 120)"*, *"Comprovante anexado por Mariana"*, *"Novo membro aceitou convite"*, garantindo total transparência e confiabilidade. |
| **Plano Premium (Stripe)** | **Monetização e Cobrança do SaaS** | Checkout Stripe para contratação da assinatura Pro Família, gerenciamento de ciclo de vida da assinatura via Webhooks e desbloqueio de recursos avançados. |
| **Frontend (React + Vite)** | **Interface Responsiva (Web & Mobile)** | Dashboard financeiro moderno, visualização de extrato, modal de lançamento rápido de despesa com envio de foto e gráficos de despesas por categoria e por pessoa. |
| **Docker Compose & Portainer** | **Orquestração de Microsserviços** | A mesma infraestrutura com isolamento de rede, containers dedicados para frontend, backend, auth-service, log-service, redis, minio e mariadb. |

---

## 10. Backlog de Desenvolvimento (Próximas Entregas)

As próximas entregas do projeto estão organizadas no roadmap abaixo (Issues do GitHub):

1. **Issue #1 - Modelagem de Dados Financeiros e Migrations:**
   - Criar tabelas de `contas`, `membros_conta`, `categorias`, `transacoes` e `anexos_comprovantes`.
2. **Issue #2 - Módulo de Transações e Balanço Financeiro:**
   - Implementar endpoints no backend para criar, listar, editar e categorizar despesas/receitas, além de rota para cálculo do balanço compartilhado da conta.
3. **Issue #3 - Sistema de Convites para Membros (Afiliados):**
   - Criação de tokens únicos de convite gerados pelo titular para entrada de familiares/cônjuges na conta compartilhada com controle RBAC.
4. **Issue #4 - Anexo de Comprovantes Integrado ao MinIO:**
   - Rota de upload de arquivos (imagens/PDFs) no serviço de armazenamento MinIO e relacionamento do anexo à despesa correspondente.
5. **Issue #5 - Assinatura Pro com Stripe Checkout e Webhooks:**
   - Implementação do fluxo de checkout do Stripe, tratamento de eventos de assinatura paga/cancelada e controle de restrições (limite de membros e comprovantes do plano Free).

---

## Stack Tecnológica

- **Frontend:** React, Vite, Tailwind CSS / Vanilla CSS responsivo
- **Backend Principal:** Node.js, Express, Sequelize/MySQL
- **Serviço de Autenticação (Auth-Service):** Node.js, Express, JWT, Bcrypt, Nodemailer (Mailtrap/Brevo)
- **Serviço de Auditoria (Log-Service):** Node.js, Redis Streams
- **Armazenamento de Objetos (Storage):** MinIO (S3-compatible)
- **Banco de Dados:** MariaDB / MySQL
- **Mensageria e Cache:** Redis 7
- **Pagamentos e Assinaturas:** Stripe API
- **Containerização:** Docker e Docker Compose