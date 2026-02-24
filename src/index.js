import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Only send errors in production; keeps dev console clean
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
});

function ErrorFallback({ error, resetError }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      fontFamily: "'Open Sans', sans-serif",
      background: '#faf8f5',
    }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#2c2c2c' }}>
        Something went wrong
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 32, maxWidth: 360, lineHeight: 1.6 }}>
        An unexpected error occurred. It has been reported automatically.
      </div>
      <button
        onClick={resetError}
        style={{
          background: '#eda35a', color: 'white', border: 'none',
          borderRadius: 10, padding: '12px 28px', fontSize: 14,
          fontWeight: 600, cursor: 'pointer', fontFamily: "'Open Sans', sans-serif",
        }}
      >
        Try again
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog={false}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
