import express, { Request, Response } from 'express';

const router = express.Router();

// Mock upload route for demo purposes
router.post('/file', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'user-id header required' });
    }

    // Mock file upload response
    res.json({
      success: true,
      fileId: `file-${Date.now()}`,
      message: 'File uploaded successfully (mock)',
      size: 1024,
      type: 'application/octet-stream'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
  return;
});

export default router;
