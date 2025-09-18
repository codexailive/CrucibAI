import React, { useState, ChangeEvent } from 'react';

interface CodeEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  authToken?: string; // Assume passed from auth context
}

const CodeEditor: React.FC<CodeEditorProps> = (props: CodeEditorProps) => {
  const { initialCode = '', onCodeChange, authToken } = props;
  const [code, setCode] = useState(initialCode);
  const [amplifiedCode, setAmplifiedCode] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleAmplify = async () => {
    if (!code.trim()) {
      setError('No code to amplify');
      return;
    }
    try {
      setError('');
      const response = await fetch('/api/ai/amplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code, context: 'amplify editing' }),
      });
      if (!response.ok) throw new Error('Amplification failed');
      const data = await response.json();
      setAmplifiedCode(data.amplified || '');
    } catch (err) {
      setError('Error amplifying code: ' + (err as Error).message);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', selectedFile.type.includes('video') ? 'video' : 'doc');
    try {
      setUploadStatus('Uploading...');
      setError('');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setUploadStatus(`Uploaded: ${data.id || 'processed'}`);
      // Optionally, amplify or integrate uploaded content
      if (data.extracted) {
        setCode((prev: string) => prev + '\n// Extracted from upload:\n' + data.extracted);
      }
    } catch (err) {
      setError('Upload error: ' + (err as Error).message);
      setUploadStatus('');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setUploadStatus('');
  };

  // Placeholder for real-time editing (e.g., integrate Socket.io later)
  // useEffect(() => {
  //   const socket = io();
  //   socket.on('code-update', (newCode) => setCode(newCode));
  //   return () => socket.disconnect();
  // }, []);

  return (
    <div className="code-editor-container p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">AI-Amplified Code Editor</h2>
      
      <div className="mb-4">
        <label htmlFor="code-input" className="block text-sm font-medium mb-2">Code:</label>
        <textarea
          id="code-input"
          value={code}
          onChange={handleCodeChange}
          placeholder="Enter your code here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Code editor"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleAmplify}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={!code.trim()}
          aria-label="Amplify code with AI"
        >
          Amplify with AI
        </button>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.doc,.docx,video/*"
            onChange={handleFileSelect}
            className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            aria-label="Upload document or video"
          />
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            aria-label="Upload file"
          >
            Upload
          </button>
        </div>
      </div>

      {uploadStatus && (
        <p className={`mb-2 p-2 rounded ${uploadStatus.includes('Uploading') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {uploadStatus}
        </p>
      )}

      {amplifiedCode && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">AI Amplified Code:</label>
          <pre className="bg-gray-200 p-3 rounded-md overflow-auto max-h-48">
            {amplifiedCode}
          </pre>
        </div>
      )}

      {error && (
        <p className="mb-4 p-2 bg-red-100 text-red-800 rounded-md" role="alert">
          {error}
        </p>
      )}

      {/* Real-time indicator placeholder */}
      <p className="text-sm text-gray-500 mt-4">Real-time collaboration: Ready (Socket.io integration pending)</p>
    </div>
  );
};

export default CodeEditor;