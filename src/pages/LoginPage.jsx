import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: 'var(--background)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-main)',
          fontWeight: 'normal',
          letterSpacing: '-0.03em',
          marginBottom: '0.5rem',
        }}>
          Omni Lab
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: '1rem',
        }}>
          Sign in to your team account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-sans)',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-sans)',
          }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-sans)',
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.875rem 1.5rem',
            backgroundColor: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#1a1918',
            fontSize: '1rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
            marginTop: '0.5rem',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{
        marginTop: '2rem',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-sans)',
      }}>
        Don't have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-sans)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Create one
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
