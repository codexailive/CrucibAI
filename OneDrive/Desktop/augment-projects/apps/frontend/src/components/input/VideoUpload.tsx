import React, { ChangeEvent, useState } from 'react';

interface VideoUploadProps {
  onUpload?: (file: File) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onUpload?.(file);
    }
  };

  return (
    <div>
      <h3>Upload Video</h3>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
      />
      {selectedFile && <p>Selected: {selectedFile.name}</p>}
    </div>
  );
};

export default VideoUpload;