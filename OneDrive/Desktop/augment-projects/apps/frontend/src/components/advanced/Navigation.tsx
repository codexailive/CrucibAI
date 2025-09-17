import React from 'react';

const Navigation: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-950/90 to-purple-950/90 shadow-lg border-b border-blue-800 flex items-center justify-between px-8 py-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow">C</div>
        <span className="text-2xl font-bold text-blue-200 tracking-wide">CrucibleAI</span>
      </div>
      <div className="hidden md:flex space-x-8 text-blue-100 font-medium">
        <a href="#dashboard" className="hover:text-blue-400 transition">Dashboard</a>
        <a href="#deployments" className="hover:text-blue-400 transition">Deployments</a>
        <a href="#billing" className="hover:text-blue-400 transition">Billing</a>
        <a href="#support" className="hover:text-blue-400 transition">Support</a>
        <a href="#knowledge" className="hover:text-blue-400 transition">Knowledge Base</a>
      </div>
      <div className="flex items-center space-x-4">
        <button className="px-4 py-2 rounded-lg border border-blue-700 bg-blue-800 text-blue-200 hover:bg-blue-700 transition">Sign In</button>
        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">Start Free</button>
      </div>
    </nav>
  );
};

export default Navigation;
