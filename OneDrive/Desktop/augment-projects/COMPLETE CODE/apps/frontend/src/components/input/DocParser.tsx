import React, { useState } from 'react';

interface DocParserProps {
  onFileUpload?: (file: File) => void;
}

const DocParser: React.FC<DocParserProps> = ({ onFileUpload }) => {
  const [status, setStatus] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setStatus('Uploading...');
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'user-id': 'test-user',
        },
      })
        .then(response => response.json())
        .then(data => {
          setStatus(data.message || data.error);
          if (onFileUpload && data.message) {
            onFileUpload(file);
          }
        })
        .catch(error => setStatus('Upload failed'));
    }
  };

  return (
    <div>
      <h3>Document Parser</h3>
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
      <p>{status}</p>
    </div>
  );
};

export default DocParser;