const db = require('../config/database');
const logServiceClient = require('../services/logServiceClient');

function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return require('stripe')(secretKey);
}

const stripeController = {
  // Retorna status atual da assinatura e contagem de limites do usuário autenticado
  async getStatus(req, res) {
    try {
      const usuario_id = req.user.id;
      const users = await db.query(
        'SELECT id, nome, email, plano, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end FROM usuarios WHERE id = ?',
        [usuario_id]
      );

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = users[0];

      // Contagem de transações criadas no mês corrente
      const countResult = await db.query(
        `SELECT COUNT(*) as total 
         FROM transacoes 
         WHERE usuario_id = ? 
           AND MONTH(criado_em) = MONTH(CURRENT_DATE()) 
           AND YEAR(criado_em) = YEAR(CURRENT_DATE())`,
        [usuario_id]
      );

      const transacoesMes = countResult[0]?.total || 0;
      const limiteFree = 3;

      res.json({
        plano: user.plano || 'free',
        is_pro: user.plano === 'pro' && user.subscription_status === 'active',
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        current_period_end: user.subscription_current_period_end,
        uso_mes: {
          transacoes: transacoesMes,
          limite: user.plano === 'pro' ? null : limiteFree,
          atingiu_limite: user.plano !== 'pro' && transacoesMes >= limiteFree
        }
      });
    } catch (error) {
      console.error('Erro ao buscar status da assinatura:', error);
      res.status(500).json({ error: 'Erro ao buscar status da assinatura' });
    }
  },

  // Cria Checkout Session para o Plano Pro (R$ 19,90/mês)
  async createCheckoutSession(req, res) {
    try {
      const stripe = getStripeInstance();
      if (!stripe) {
        return res.status(500).json({ 
          error: 'Stripe não está configurado. Defina STRIPE_SECRET_KEY nas variáveis de ambiente.' 
        });
      }

      const usuario_id = req.user.id;
      const users = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuario_id]);
      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = users[0];
      let customerId = user.stripe_customer_id;

      // Se o usuário ainda não tiver customer no Stripe, cria agora
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.nome,
          metadata: {
            usuario_id: String(user.id)
          }
        });
        customerId = customer.id;
        await db.query('UPDATE usuarios SET stripe_customer_id = ? WHERE id = ?', [customerId, user.id]);
      }

      const priceId = process.env.STRIPE_PRICE_ID_PRO;
      if (!priceId) {
        return res.status(500).json({ 
          error: 'STRIPE_PRICE_ID_PRO não está configurado nas variáveis de ambiente.' 
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8201';

      // Criar a sessão de checkout no modo subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/?upgrade=canceled`,
        metadata: {
          usuario_id: String(user.id),
        },
        subscription_data: {
          metadata: {
            usuario_id: String(user.id),
          },
        },
      });

      logServiceClient.sendLog(usuario_id, 'checkout_assinatura_iniciado', {
        sessionId: session.id,
        customerId
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Erro ao criar checkout session:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar sessão de checkout' });
    }
  },

  // Cria sessão do Billing Portal para o cliente gerenciar a assinatura
  async createPortalSession(req, res) {
    try {
      const stripe = getStripeInstance();
      if (!stripe) {
        return res.status(500).json({ error: 'Stripe não está configurado.' });
      }

      const usuario_id = req.user.id;
      const users = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuario_id]);
      const user = users?.[0];

      if (!user || !user.stripe_customer_id) {
        return res.status(400).json({ 
          error: 'Você ainda não possui um registro de cliente no Stripe. Faça um upgrade primeiro!' 
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8201';

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${frontendUrl}/`,
      });

      logServiceClient.sendLog(usuario_id, 'portal_cliente_aberto', {
        customerId: user.stripe_customer_id
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Erro ao abrir Billing Portal:', error);
      res.status(500).json({ error: error.message || 'Erro ao abrir portal do cliente' });
    }
  },

  // Webhook do Stripe com verificação de assinatura e idempotência
  async handleWebhook(req, res) {
    const stripe = getStripeInstance();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // 1. Validação da assinatura criptográfica do Webhook
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } catch (err) {
        console.error('✗ Assinatura do Webhook inválida:', err.message);
        return res.status(400).send(`Webhook Signature Error: ${err.message}`);
      }
    } else {
      // Em modo de testes se não houver segredo, aceita o body parseado
      event = req.body;
    }

    if (!event || !event.id) {
      return res.status(400).json({ error: 'Evento inválido' });
    }

    try {
      // 2. Idempotência: verificar se o evento já foi processado anteriormente
      const existingEvents = await db.query('SELECT id FROM stripe_events WHERE id = ?', [event.id]);
      if (existingEvents && existingEvents.length > 0) {
        console.log(`ℹ Webhook Stripe ${event.id} (${event.type}) já processado anteriormente. Ignorando duplicação.`);
        return res.status(200).json({ received: true, duplicate: true });
      }

      // Registrar o evento para evitar processamento duplicado futuro
      await db.query('INSERT INTO stripe_events (id, tipo) VALUES (?, ?)', [event.id, event.type]);

      console.log(`🔔 Webhook Stripe recebido: ${event.type} [${event.id}]`);

      // 3. Processamento dos 4 eventos obrigatórios
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.mode === 'subscription') {
            const customerId = session.customer;
            const subscriptionId = session.subscription;
            let usuarioId = session.metadata?.usuario_id;

            if (!usuarioId) {
              const users = await db.query('SELECT id FROM usuarios WHERE stripe_customer_id = ?', [customerId]);
              usuarioId = users?.[0]?.id;
            }

            if (usuarioId) {
              await db.query(
                `UPDATE usuarios 
                 SET plano = 'pro', 
                     subscription_status = 'active', 
                     stripe_customer_id = ?, 
                     stripe_subscription_id = ? 
                 WHERE id = ?`,
                [customerId, subscriptionId, usuarioId]
              );

              logServiceClient.sendLog(usuarioId, 'assinatura_pro_iniciada', {
                customerId,
                subscriptionId,
                sessionId: session.id,
                evento: event.id
              });
              console.log(`✓ Usuário ${usuarioId} promovido para Plano Pro via Webhook.`);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const subscriptionId = subscription.id;
          const customerId = subscription.customer;
          const status = subscription.status;
          const priceId = subscription.items?.data?.[0]?.price?.id || null;
          const currentPeriodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000) 
            : null;

          // Se status for ativo, plano é 'pro'; caso contrário (cancelado, unpaid, etc.), volta para 'free'
          const novoPlano = status === 'active' ? 'pro' : 'free';

          await db.query(
            `UPDATE usuarios 
             SET plano = ?, 
                 subscription_status = ?, 
                 subscription_price_id = ?, 
                 subscription_current_period_end = ? 
             WHERE stripe_subscription_id = ? OR stripe_customer_id = ?`,
            [novoPlano, status, priceId, currentPeriodEnd, subscriptionId, customerId]
          );

          const users = await db.query('SELECT id FROM usuarios WHERE stripe_customer_id = ?', [customerId]);
          const usuarioId = users?.[0]?.id || 0;

          logServiceClient.sendLog(usuarioId, 'assinatura_atualizada', {
            subscriptionId,
            status,
            novoPlano,
            evento: event.id
          });
          console.log(`✓ Assinatura ${subscriptionId} atualizada para status: ${status} (Plano: ${novoPlano}).`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const subscriptionId = subscription.id;
          const customerId = subscription.customer;

          // Assinatura encerrada/cancelada: volta o usuário para o Plano Free
          await db.query(
            `UPDATE usuarios 
             SET plano = 'free', 
                 subscription_status = 'canceled' 
             WHERE stripe_subscription_id = ? OR stripe_customer_id = ?`,
            [subscriptionId, customerId]
          );

          const users = await db.query('SELECT id FROM usuarios WHERE stripe_customer_id = ?', [customerId]);
          const usuarioId = users?.[0]?.id || 0;

          logServiceClient.sendLog(usuarioId, 'assinatura_cancelada', {
            subscriptionId,
            evento: event.id
          });
          console.log(`✓ Assinatura ${subscriptionId} cancelada. Usuário retornou para o Plano Free.`);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const customerId = invoice.customer;

          // Falha de pagamento da renovação: marca inadimplente e revoga benefícios Pro
          await db.query(
            `UPDATE usuarios 
             SET subscription_status = 'past_due', 
                 plano = 'free' 
             WHERE stripe_customer_id = ?`,
            [customerId]
          );

          const users = await db.query('SELECT id FROM usuarios WHERE stripe_customer_id = ?', [customerId]);
          const usuarioId = users?.[0]?.id || 0;

          logServiceClient.sendLog(usuarioId, 'pagamento_assinatura_falhou', {
            customerId,
            invoiceId: invoice.id,
            evento: event.id
          });
          console.log(`⚠ Falha no pagamento da fatura ${invoice.id} para o customer ${customerId}. Usuário bloqueado do Pro.`);
          break;
        }

        default:
          console.log(`ℹ Webhook ${event.type} recebido sem ação necessária.`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Erro ao processar webhook do Stripe:', err);
      res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
  }
};

module.exports = stripeController;
