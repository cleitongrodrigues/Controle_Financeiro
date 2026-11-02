import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Top Navbar */}
      <header className="landing-header">
        <div className="landing-container nav-container">
          <div className="brand-logo">
            <span className="logo-icon">💳</span>
            <span className="logo-text">Conta <strong>Comigo</strong></span>
          </div>
          <nav className="landing-nav">
            <a href="#como-funciona">Como Funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
            <Link to="/login" className="btn-secondary">Entrar</Link>
            <Link to="/login?mode=register" className="btn-primary">Criar Conta Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container hero-content">
          <div className="hero-badge">✨ Chega de brigas por dinheiro</div>
          <h1 className="hero-title">
            O controle financeiro que une o <span className="gradient-text">pessoal</span> e o <span className="gradient-text-alt">familiar</span>
          </h1>
          <p className="hero-description">
            Organize suas contas individuais ou compartilhe o orçamento da casa com quem você divide a rotina. Convide seu parceiro ou família por link, anexe fotos de comprovantes e veja o balanço automático de quem pagou o quê.
          </p>
          <div className="hero-cta-group">
            <Link to="/login?mode=register" className="btn-cta">
              Começar Agora Gratuitamente ➔
            </Link>
            <a href="#como-funciona" className="btn-demo">
              Ver Como Funciona
            </a>
          </div>

          <div className="hero-preview-card">
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="preview-title">🏠 Casa & Família (Mariana & Lucas) — Saldo Consolidado</div>
              <div className="preview-badge">Conta Conjunta</div>
            </div>
            <div className="preview-metrics">
              <div className="metric-box">
                <span className="metric-label">Saldo em Caixa</span>
                <span className="metric-val text-green">R$ 4.250,00</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Receitas do Mês</span>
                <span className="metric-val text-blue">+ R$ 10.300,00</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Despesas Compartilhadas</span>
                <span className="metric-val text-red">- R$ 6.050,00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Section (A Dor) */}
      <section className="pain-section" id="como-funciona">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">A DOR QUE VOCÊ CONHECE</span>
            <h2>Por que planilhas e grupos de WhatsApp não funcionam mais?</h2>
            <p>Dividir os boletos da casa não deveria ser sinônimo de desgaste na relação.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📑</div>
              <h3>Planilhas quebram no celular</h3>
              <p>Fórmulas somem, ninguém tem paciência de abrir o Excel no supermercado e no dia 15 o controle já foi abandonado.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Comprovantes perdidos no WhatsApp</h3>
              <p>Prints de PIX se perdem em conversas e na hora de fechar as contas ninguém lembra quem pagou o aluguel ou o mercado.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>Falta de transparência e atritos</h3>
              <p>A sensação incômoda de que um está pagando mais que o outro. O Conta Comigo traz clareza matemática e paz para o casal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section (Recursos) */}
      <section className="features-section" id="recursos">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">A SOLUÇÃO CONTA COMIGO</span>
            <h2>Tudo o que sua casa precisa em um só lugar</h2>
          </div>

          <div className="solutions-grid">
            <div className="solution-item">
              <span className="sol-icon">👥</span>
              <h4>Contas Pessoais e Conjuntas</h4>
              <p>Mantenha seus gastos pessoais 100% privados e tenha carteiras conjuntas para a casa com o parceiro ou família.</p>
            </div>
            <div className="solution-item">
              <span className="sol-icon">🔗</span>
              <h4>Convite Fácil para a Família</h4>
              <p>Gere um código de convite e envie pelo WhatsApp. Seu parceiro ou parente entra na conta compartilhada em segundos com login próprio.</p>
            </div>
            <div className="solution-item">
              <span className="sol-icon">🧾</span>
              <h4>Comprovantes e Recibos Salvos</h4>
              <p>Tirou foto do comprovante PIX ou cupom do supermercado? Anexe direto na despesa para nunca mais perder um comprovante no WhatsApp.</p>
            </div>
            <div className="solution-item">
              <span className="sol-icon">🛡️</span>
              <h4>Total Transparência e Segurança</h4>
              <p>Você decide quem gerencia as contas e quem lança despesas. Todo gasto registrado fica organizado para manter as finanças 100% claras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Planos) */}
      <section className="pricing-section" id="planos">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">PLANOS TRANSPARENTES</span>
            <h2>Comece grátis, evolua quando sua família crescer</h2>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card free-plan">
              <div className="plan-header">
                <h3>Plano Free</h3>
                <p>Ideal para casais que estão começando a se organizar.</p>
                <div className="plan-price">R$ 0 <span>/ mês</span></div>
              </div>
              <ul className="plan-features">
                <li>✅ Controle pessoal individual completo</li>
                <li>✅ Até 1 membro convidado (dupla/casal)</li>
                <li>✅ Histórico dos últimos 3 meses</li>
                <li>✅ Até 15 comprovantes e recibos anexados por mês</li>
                <li>✅ Categorias essenciais de despesas e receitas</li>
              </ul>
              <Link to="/login?mode=register" className="btn-plan btn-plan-free">Criar Conta Gratuita</Link>
            </div>

            <div className="pricing-card pro-plan featured">
              <div className="badge-popular">MAIS POPULAR</div>
              <div className="plan-header">
                <h3>Conta Comigo Pro</h3>
                <p>Para famílias e repúblicas que querem tranquilidade total.</p>
                <div className="plan-price">R$ 19,90 <span>/ mês</span></div>
              </div>
              <ul className="plan-features">
                <li>⭐ <strong>Membros ilimitados</strong> via link de convite</li>
                <li>⭐ Múltiplas contas conjuntas e carteiras</li>
                <li>⭐ <strong>Upload ilimitado de comprovantes</strong> e cupons fiscais</li>
                <li>⭐ Histórico completo e sem limites</li>
                <li>⭐ Relatório automático de "Quem gastou o quê"</li>
                <li>⭐ Notificações e acompanhamento detalhado de gastos</li>
              </ul>
              <Link to="/login?mode=register" className="btn-plan btn-plan-pro">Assinar Pro com Stripe</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-container">
          <div className="footer-left">
            <p><strong>Conta Comigo</strong> — Plataforma SaaS de Controle Financeiro Colaborativo.</p>
            <p>ISW055 · Projeto de Nuvem · Orientador: <a href="https://github.com/siriani" target="_blank" rel="noreferrer">@siriani</a></p>
          </div>
          <div className="footer-right">
            <Link to="/login">Acessar Sistema</Link>
            <span>•</span>
            <a href="https://github.com/cleitongrodrigues/Controle_Financeiro" target="_blank" rel="noreferrer">Repositório GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
