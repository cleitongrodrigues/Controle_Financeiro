const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER || '',
    pass: process.env.MAILTRAP_PASS || '',
  },
});

module.exports = {
  async sendPasswordReset(email, resetLink) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .header { background: #667eea; color: white; padding: 20px; border-radius: 4px; text-align: center; }
            .content { padding: 20px; background: white; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Redefinição de Senha - Cine Mágico</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para continuar:</p>
              <a href="${resetLink}" class="button">Redefinir Senha</a>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p><code>${resetLink}</code></p>
              <p style="color: #e74c3c; font-weight: bold;">⚠️ Este link expira em 30 minutos</p>
              <p>Se você não solicitou esta redefinição, ignore este email.</p>
            </div>
            <div class="footer">
              <p>© 2024 Cine Mágico. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: process.env.MAILTRAP_FROM || 'noreply@cinemagico.com',
        to: email,
        subject: 'Redefinição de Senha - Cine Mágico',
        html: htmlContent,
        text: `Clique aqui para redefinir sua senha: ${resetLink}\n\nEste link expira em 30 minutos.`,
      });
      console.log(`✓ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },
};
