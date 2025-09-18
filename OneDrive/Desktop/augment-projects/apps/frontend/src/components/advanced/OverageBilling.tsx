import React, { useEffect, useState } from 'react';

const OverageBilling: React.FC = () => {
  const [usage, setUsage] = useState<number>(0);
  const [quota] = useState<number>(10 * 1024 * 1024); // 10MB for demo
  const [overage, setOverage] = useState<number>(0);

  useEffect(() => {
    // Simulate fetching usage from backend
    fetch('/api/usage', { headers: { 'user-id': 'demo-user-123' } })
      .then(res => res.json())
      .then(data => {
        setUsage(data.used || 0);
        setOverage(Math.max(0, (data.used || 0) - quota));
      });
  }, [quota]);

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Overage Billing</h2>
      <div className="mb-2 text-blue-200">Quota: {Math.round(quota / 1024)} KB</div>
      <div className="mb-2 text-blue-200">Used: {Math.round(usage / 1024)} KB</div>
      <div className={overage > 0 ? 'text-red-400' : 'text-green-400'}>
        {overage > 0 ? `Overage: ${Math.round(overage / 1024)} KB` : 'No overage'}
      </div>
      {overage > 0 && (
        <div className="mt-2 text-blue-100">You will be billed for overage at $0.10/MB.</div>
      )}
    </div>
  );
};

export default OverageBilling;
