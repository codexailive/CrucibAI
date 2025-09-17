import React, { useEffect, useState } from 'react';

interface Deployment {
  id: string;
  name: string;
  status: string;
  provider: string;
}

const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching deployments from backend
    fetch('/api/deployments', { headers: { 'user-id': 'demo-user-123' } })
      .then(res => res.json())
      .then(data => {
        setDeployments(data.deployments || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Deployments</h2>
      {loading ? (
        <div className="text-blue-200">Loading deployments...</div>
      ) : deployments.length === 0 ? (
        <div className="text-blue-200">No deployments found.</div>
      ) : (
        <table className="w-full text-blue-100">
          <thead>
            <tr>
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Provider</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map(dep => (
              <tr key={dep.id} className="border-t border-blue-800">
                <td className="py-2">{dep.name}</td>
                <td className="py-2">{dep.provider}</td>
                <td className="py-2">{dep.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Deployments;
