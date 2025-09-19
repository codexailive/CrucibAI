import { Router } from 'express';
import { SupportService } from '../services/support/SupportService';

const router = Router();
const supportService = new SupportService();

// Create support ticket
router.post('/tickets', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subject, message, priority, category } = req.body;
    const ticket = await supportService.createTicket(req.user.id, subject, message, priority, category);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get user's tickets
router.get('/tickets', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const tickets = await supportService.getUserTickets(req.user.id);

    res.json(tickets);
  } catch (error) {
    console.error('Error getting support tickets:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
});

// Get ticket details
router.get('/tickets/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ticket = await supportService.getTicket(req.params.id);

    res.json(ticket);
  } catch (error) {
    console.error('Error getting support ticket:', error);
    res.status(500).json({ error: 'Failed to get support ticket' });
  }
});

// Add reply to ticket
router.post('/tickets/:id/replies', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message } = req.body;

    const reply = await supportService.addReply(
      req.params.id,
      req.user.id,
      message,
      true
    );

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error adding reply to ticket:', error);
    res.status(500).json({ error: 'Failed to add reply to ticket' });
  }
});

// Close ticket
router.post('/tickets/:id/close', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await supportService.closeTicket(req.params.id, req.user.id);

    res.json({ message: 'Ticket closed successfully' });
  } catch (error) {
    console.error('Error closing support ticket:', error);
    res.status(500).json({ error: 'Failed to close support ticket' });
  }
});

// Reopen ticket
router.post('/tickets/:id/reopen', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message } = req.body;

    await supportService.reopenTicket(req.params.id, req.user.id, message);

    res.json({ message: 'Ticket reopened successfully' });
  } catch (error) {
    console.error('Error reopening support ticket:', error);
    res.status(500).json({ error: 'Failed to reopen support ticket' });
  }
});

// Search knowledge base
router.get('/knowledge-base/search', async (req, res) => {
  try {
    const { query, category } = req.query;

    const articles = await supportService.searchKnowledgeBase(
      query as string,
      category as string
    );

    res.json(articles);
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// Get knowledge base articles
router.get('/knowledge-base', async (req, res) => {
  try {
    const { category } = req.query;

    const articles = await supportService.getKnowledgeBaseArticles(category as string);

    res.json(articles);
  } catch (error) {
    console.error('Error getting knowledge base articles:', error);
    res.status(500).json({ error: 'Failed to get knowledge base articles' });
  }
});

// Get support metrics (admin only)
router.get('/metrics', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const period = req.query.period as 'day' | 'week' | 'month' || 'month';

    const metrics = await supportService.getSupportMetrics(period);

    res.json(metrics);
  } catch (error) {
    console.error('Error getting support metrics:', error);
    res.status(500).json({ error: 'Failed to get support metrics' });
  }
});

// Rate ticket satisfaction (after ticket is closed)
router.post('/tickets/:id/rate', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await supportService.rateTicket(req.params.id, req.user.id, rating);

    res.json({ message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Error rating ticket:', error);
    res.status(500).json({ error: 'Failed to rate ticket' });
  }
});

export default router;
