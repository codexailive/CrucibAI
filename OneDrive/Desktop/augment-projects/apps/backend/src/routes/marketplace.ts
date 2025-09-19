import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { PluginService } from '../services/marketplace/PluginService';

const router = Router();
const pluginService = new PluginService();
const prisma = new PrismaClient();

// Get available plugins
router.get('/plugins', async (req, res) => {
  try {
    const { category, tags } = req.query;
    
    const tagsArray = tags ? (tags as string).split(',') : undefined;
    
    const plugins = await pluginService.getAvailablePlugins(
      category as string,
      Array.isArray(tagsArray) ? tagsArray.join(',') : tagsArray
    );

    res.json(plugins);
  } catch (error) {
    console.error('Error getting available plugins:', error);
    res.status(500).json({ error: 'Failed to get available plugins' });
  }
});

// Get plugin details
router.get('/plugins/:id', async (req, res) => {
  try {
    const plugin = await prisma.marketplacePlugin.findUnique({
      where: { id: req.params.id },
      include: {
        installations: {
          select: {
            id: true,
            installedAt: true
          }
        }
      }
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json({
      ...plugin,
      installCount: plugin.installations.length
    });
  } catch (error) {
    console.error('Error getting plugin details:', error);
    res.status(500).json({ error: 'Failed to get plugin details' });
  }
});

// Install plugin for user
router.post('/plugins/:id/install', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await pluginService.installPluginForUser(req.user.id, req.params.id);

    res.json({ message: 'Plugin installed successfully' });
  } catch (error) {
    console.error('Error installing plugin:', error);
    res.status(500).json({ error: 'Failed to install plugin' });
  }
});

// Uninstall plugin for user
router.delete('/plugins/:id/install', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await pluginService.uninstallPluginForUser(req.user.id, req.params.id);

    res.json({ message: 'Plugin uninstalled successfully' });
  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    res.status(500).json({ error: 'Failed to uninstall plugin' });
  }
});

// Get user's installed plugins
router.get('/plugins/installed', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const plugins = await pluginService.getUserInstalledPlugins(req.user.id);

    res.json(plugins);
  } catch (error) {
    console.error('Error getting installed plugins:', error);
    res.status(500).json({ error: 'Failed to get installed plugins' });
  }
});

// Execute plugin
router.post('/plugins/:id/execute', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { method, params } = req.body;

    const result = await pluginService.executePlugin(
      req.params.id,
      req.user.id,
      { method, params }
    );

    res.json(result);
  } catch (error) {
    console.error('Error executing plugin:', error);
    res.status(500).json({ error: 'Failed to execute plugin' });
  }
});

// Upload plugin (developer only)
router.post('/plugins/upload', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is a developer
    if (req.user.role !== 'developer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Developer access required' });
    }

    // In a real implementation, you would handle file upload here
    // For now, we'll return a mock response
    res.status(201).json({
      message: 'Plugin uploaded successfully',
      pluginId: 'mock-plugin-id'
    });
  } catch (error) {
    console.error('Error uploading plugin:', error);
    res.status(500).json({ error: 'Failed to upload plugin' });
  }
});

// Get plugin categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.marketplacePlugin.findMany({
      where: { status: 'approved' },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category);

    res.json(categoryList);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get popular plugins
router.get('/popular', async (req, res) => {
  try {
    const popularPlugins = await prisma.marketplacePlugin.findMany({
      where: { status: 'approved' },
      include: {
        installations: {
          select: { id: true }
        }
      },
      orderBy: {
        downloads: 'desc'
      },
      take: 10
    });

    const pluginsWithStats = popularPlugins.map(plugin => ({
      ...plugin,
      installCount: plugin.installations.length
    }));

    res.json(pluginsWithStats);
  } catch (error) {
    console.error('Error getting popular plugins:', error);
    res.status(500).json({ error: 'Failed to get popular plugins' });
  }
});

// Search plugins
router.get('/search', async (req, res) => {
  try {
    const { q, category, tags } = req.query;

    let whereClause: any = {
      status: 'approved'
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      whereClause.tags = {
        hasSome: tagArray
      };
    }

    const plugins = await prisma.marketplacePlugin.findMany({
      where: whereClause,
      include: {
        installations: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pluginsWithStats = plugins.map(plugin => ({
      ...plugin,
      installCount: plugin.installations.length
    }));

    res.json(pluginsWithStats);
  } catch (error) {
    console.error('Error searching plugins:', error);
    res.status(500).json({ error: 'Failed to search plugins' });
  }
});

export default router;
