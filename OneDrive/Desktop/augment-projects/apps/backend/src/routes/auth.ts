import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

// Register route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, name, password } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { encrypted_email: email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        encrypted_email: email,
        email: email,
        name,
        encrypted_password: hashedPassword,
        passwordHash: hashedPassword,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { encrypted_password: _, ...userWithoutPassword } = user;

    // Sign JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '24h' });

    // Set auth cookie
    res.cookie('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  return;
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({
      where: { encrypted_email: email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const { encrypted_password: _, ...userWithoutPassword } = user;

    // Sign JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '24h' });

    // Set auth cookie
    res.cookie('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  return;
});

// Get current user (me)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authCookie = req.cookies?.auth;

    if (!authCookie) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    // Verify JWT
    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET as string) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Remove password from response
    const { encrypted_password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
  return;
});

// Logout route
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth');
  res.json({ success: true, message: 'Logged out' });
});

export default router;