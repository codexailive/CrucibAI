import React, { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [message, setMessage] = useState<string>('Checking backend...');

  const checkBackend = async () => {
    try {
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:4000/live', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // If backend returns plain text "OK", that's fine.
      setStatus('ok');
      setMessage('Backend connected ✅');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatus('fail');
      setMessage(`Backend not connected ❌ — ${msg}`);
    }
  };

  useEffect(() => {
    void checkBackend();
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial', padding: 24 }}>
      <h1>CrucibAI Frontend</h1>
      <p>Status: <strong>{status}</strong></p>
      <p>{message}</p>
      <button onClick={() => void checkBackend()}>Re-check backend</button>
    </div>
  );
}

export default App;
