import React, { useEffect, useState } from 'react';

const SubscriptionBilling: React.FC = () => {
  const [plan, setPlan] = useState('Professional');
  const [price, setPrice] = useState(59);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    // Simulate fetching invoices from backend
    fetch('/api/invoices', { headers: { 'user-id': 'demo-user-123' } })
      .then(res => res.json())
      .then(data => setInvoices(data.invoices || []));
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Subscription & Billing</h2>
      <div className="mb-2 text-blue-200">Current Plan: <span className="font-semibold">{plan}</span></div>
      <div className="mb-4 text-blue-200">Price: <span className="font-semibold">${price}/month</span></div>
      <h3 className="text-lg font-bold text-blue-200 mb-2">Invoices</h3>
      <ul className="text-blue-100">
        {invoices.length === 0 ? (
          <li>No invoices found.</li>
        ) : (
          invoices.map((inv, idx) => (
            <li key={idx} className="mb-1">{inv.date}: ${inv.amount} - {inv.status}</li>
          ))
        )}
      </ul>
      <button className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-lg">Update Payment Method</button>
    </div>
  );
};

export default SubscriptionBilling;
