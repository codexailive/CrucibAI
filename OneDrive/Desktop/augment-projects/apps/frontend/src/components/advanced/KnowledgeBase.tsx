import React, { useState } from 'react';

const articles = [
  { id: 1, title: 'How to Deploy an App', content: 'Step-by-step guide to deploying your app with CrucibleAI.' },
  { id: 2, title: 'Understanding Overage Billing', content: 'Learn how overage billing works and how to avoid extra charges.' },
  { id: 3, title: 'Managing Your Subscription', content: 'Update your plan, payment method, and view invoices.' },
  { id: 4, title: 'Getting Support', content: 'How to open a ticket and get help from our team.' },
];

const KnowledgeBase: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Knowledge Base</h2>
      <ul className="mb-4">
        {articles.map(article => (
          <li key={article.id}>
            <button
              className={`w-full text-left py-2 px-3 rounded-lg mb-2 transition font-medium ${selected === article.id ? 'bg-blue-800 text-blue-200' : 'bg-blue-950/60 text-blue-100 hover:bg-blue-900'}`}
              onClick={() => setSelected(article.id)}
            >
              {article.title}
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="bg-blue-950/60 p-4 rounded-lg border border-blue-800 text-blue-100">
          <h3 className="font-bold mb-2">{articles.find(a => a.id === selected)?.title}</h3>
          <p>{articles.find(a => a.id === selected)?.content}</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
