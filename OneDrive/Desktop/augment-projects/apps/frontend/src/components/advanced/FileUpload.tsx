import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onSuccess, onError }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [used, setUsed] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('Uploading...');
    setProgress(10);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: {
          'user-id': 'demo-user-123', // Replace with real user ID
        },
        body: formData,
      });
      setProgress(80);
      const data = await res.json();
      if (res.ok) {
        setStatus('Upload successful!');
        setUsed(data.used);
        setProgress(100);
        onSuccess && onSuccess(data);
      } else {
        setStatus(data.error || 'Upload failed');
        setProgress(0);
        onError && onError(data.error || 'Upload failed');
      }
    } catch (err) {
      setStatus('Network error');
      setProgress(0);
      onError && onError('Network error');
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-700 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Upload File</h2>
      <input
        ref={inputRef}
        type="file"
        className="mb-4 block w-full text-white"
        onChange={handleChange}
      />
      {file && (
        <div className="mb-2 text-blue-200">Selected: {file.name}</div>
      )}
      <button
        onClick={handleUpload}
        disabled={!file}
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-lg mb-2"
      >
        Upload
      </button>
      {progress > 0 && (
        <div className="w-full bg-blue-900/40 rounded-full h-2 mb-2">
          <div
            className="bg-blue-400 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      <div className="text-sm text-blue-300 min-h-[24px]">{status}</div>
      {used > 0 && (
        <div className="text-xs text-blue-200 mt-2">Quota used: {Math.round(used / 1024)} KB</div>
      )}
    </div>
  );
};

export default FileUpload;
