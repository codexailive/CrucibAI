import React, { useState } from 'react';

const Support: React.FC = () => {
  const [ticket, setTicket] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    if (!ticket.trim()) {
      setError('Please enter your support request.');
      return;
    }
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setTicket('');
    }, 1000);
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Support Ticket</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 rounded-lg bg-blue-950/60 border border-blue-800 text-white mb-2"
          rows={4}
          placeholder="Describe your issue or question..."
          value={ticket}
          onChange={e => setTicket(e.target.value)}
        />
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-lg"
        >
          Submit Ticket
        </button>
      </form>
      {submitted && (
        <div className="mt-4 text-green-400">Your ticket has been submitted! Our team will respond soon.</div>
      )}
    </div>
  );
};

export default Support;
