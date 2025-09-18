import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface CollaborationSession {
  id: string;
  name: string;
  participants: number;
  sharedContent?: string;
}

interface CollaborationHubProps {
  authToken?: string;
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({ authToken }) => {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sharedContent, setSharedContent] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // const [socket, setSocket] = useState<any>(null);

  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:3001'); // Backend socket URL
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      if (currentSessionId) {
        socketInstance.emit('join-session', currentSessionId, authToken);
      }
    });

    socketInstance.on('shared-update', (content: string) => {
      setSharedContent(content);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [currentSessionId, authToken]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/collaboration/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError('Error fetching sessions: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/collaboration/join/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId: 'current-user' }), // Assume user context
      });
      if (!response.ok) throw new Error('Failed to join session');
      setCurrentSessionId(sessionId);
      if (socket) socket.emit('join-session', sessionId, authToken);
    } catch (err) {
      setError('Error joining session: ' + (err as Error).message);
    }
  };

  const shareContent = async (content: string) => {
    if (!currentSessionId) {
      setError('No active session');
      return;
    }
    try {
      setError('');
      const response = await fetch(`/api/collaboration/share/${currentSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content, type: 'doc-ai' }), // e.g., AI output or doc
      });
      if (!response.ok) throw new Error('Failed to share content');
      // Socket emit for real-time
      // if (socket) socket.emit('share-content', { sessionId: currentSessionId, content });
      setSharedContent(content); // Local update
    } catch (err) {
      setError('Error sharing content: ' + (err as Error).message);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="collaboration-hub p-4 bg-white rounded-lg shadow-md max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Collaboration Hub</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
          {loading ? (
            <p>Loading sessions...</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                  <span>{session.name} ({session.participants})</span>
                  <button
                    onClick={() => joinSession(session.id)}
                    className={`px-3 py-1 rounded text-sm ${currentSessionId === session.id ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    aria-label={`Join session ${session.name}`}
                  >
                    {currentSessionId === session.id ? 'Joined' : 'Join'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            onClick={fetchSessions}
            className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            disabled={loading}
          >
            Refresh Sessions
          </button>
        </div>

        {/* Shared Content Area */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Shared Content</h3>
          {currentSessionId ? (
            <div className="space-y-4">
              <textarea
                value={sharedContent}
                onChange={(e) => setSharedContent(e.target.value)}
                placeholder="Shared docs or AI outputs will appear here..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Shared collaboration content"
              />
              <button
                onClick={() => shareContent(sharedContent)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                aria-label="Share current content"
              >
                Share Content
              </button>
              <p className="text-sm text-gray-500">Real-time updates via Socket.io (integration pending)</p>
            </div>
          ) : (
            <p className="text-gray-500">Join a session to view and share content.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;