// error-boundary.jsx — last line of defence: a render error shows a way out, never a blank page.

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('LifeOS render error', error, info && info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const button = {
      border: 'none', borderRadius: 14, padding: '13px 20px', fontSize: 15, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
    };
    return (
      <div role="alert" style={{
        position: 'fixed', inset: 0, zIndex: 150, background: '#0B0B11', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: 28, textAlign: 'center',
      }}>
        <h1 className="lo-display" style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Algo falló al mostrar esta pantalla</h1>
        <p style={{ margin: 0, maxWidth: 340, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>
          Tus tareas y hábitos siguen guardados en este dispositivo. Recarga para continuar.
        </p>
        <button onClick={() => window.location.reload()} style={{ ...button, background: '#E0241B', color: '#fff' }}>
          Recargar LifeOS
        </button>
      </div>
    );
  }
}

export { ErrorBoundary };
