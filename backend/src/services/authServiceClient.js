const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

module.exports = {
  async register(nome, email, password) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async verifyToken(token) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getUser(userId, token) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/user/${userId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async forgotPassword(email) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(token, password) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async checkResetToken(token) {
    try {
      const response = await fetch(`${authServiceUrl}/api/auth/reset/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
