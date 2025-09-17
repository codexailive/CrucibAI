import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="glass-card p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-gray-900/90 to-blue-900/80 border border-blue-700 max-w-4xl mx-auto mt-8">
      <h1 className="text-4xl font-bold mb-6 text-blue-300">CrucibleAI Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-blue-900/40 rounded-xl p-6 border border-blue-800">
          <h2 className="text-xl font-semibold mb-2 text-blue-200">Deployments</h2>
          <p className="text-blue-100">Manage and purchase deployments, view status, and deploy to Vercel, AWS, or Netlify.</p>
        </div>
        <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-800">
          <h2 className="text-xl font-semibold mb-2 text-purple-200">Overage Billing</h2>
          <p className="text-purple-100">See usage, overage charges, and pay only for what you use beyond your plan.</p>
        </div>
        <div className="bg-blue-900/40 rounded-xl p-6 border border-blue-800">
          <h2 className="text-xl font-semibold mb-2 text-blue-200">Support</h2>
          <p className="text-blue-100">Open support tickets, view responses, and access the knowledge base.</p>
        </div>
        <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-800">
          <h2 className="text-xl font-semibold mb-2 text-purple-200">Subscription & Billing</h2>
          <p className="text-purple-100">Manage your plan, see invoices, and update payment methods.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
