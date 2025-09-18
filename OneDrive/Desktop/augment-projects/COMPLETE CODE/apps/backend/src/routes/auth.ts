import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import * as Joi from 'joi';
import { sanitizeInput } from '../utils/sanitizer';

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
      const lang = req.query.lang as string || 'en';
      const errorMessages: Record<string, Record<string, string>> = {
        en: { 'any.required': 'Field is required', 'string.email': 'Valid email required', 'string.min': 'Password must be at least 8 characters' },
        fr: { 'any.required': 'Le champ est requis', 'string.email': 'Email valide requis', 'string.min': 'Le mot de passe doit avoir au moins 8 caractères' }
      };
      const langErrorMessages = errorMessages[lang] || errorMessages['en'];
      const localizedError = langErrorMessages[error.details[0].type as string] || error.details[0].message;
      return res.status(400).json({ error: localizedError });
    }

    const { email, name, password } = value;
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { encrypted_email: sanitizedEmail },
    });

    if (existingUser) {
      const lang = req.query.lang as string || 'en';
      const errorMessages = {
        en: 'User already exists',
        fr: 'L\'utilisateur existe déjà'
      };
      return res.status(409).json({ error: errorMessages[lang as keyof typeof errorMessages] });
    }

    // Hash password
    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        encrypted_email: sanitizedEmail,
        name: sanitizedName,
        encrypted_password: hashedPassword,
      },
    });

    // Remove password from response
    const { encrypted_password: _, ...userWithoutPassword } = user;

    // Set auth cookie with simple token (user ID for now; enhance with JWT later)
    const simpleToken = user.id;
    res.cookie('auth', simpleToken, {
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
    const lang = req.query.lang as string || 'en';
    const errorMessages = {
      en: 'Internal server error',
      fr: 'Erreur interne du serveur'
    };
    res.status(500).json({ error: errorMessages[lang as keyof typeof errorMessages] });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      const lang = req.query.lang as string || 'en';
      const errorMessages: Record<string, Record<string, string>> = {
        en: { 'any.required': 'Field is required', 'string.email': 'Valid email required', 'string.min': 'Password must be at least 8 characters' },
        fr: { 'any.required': 'Le champ est requis', 'string.email': 'Email valide requis', 'string.min': 'Le mot de passe doit avoir au moins 8 caractères' }
      };
      const langErrorMessages = errorMessages[lang] || errorMessages['en'];
      const localizedError = langErrorMessages[error.details[0].type as string] || error.details[0].message;
      return res.status(400).json({ error: localizedError });
    }

    const { email, password } = value;
    const sanitizedEmail = sanitizeInput(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { encrypted_email: sanitizedEmail },
    });

    if (!user) {
      const lang = req.query.lang as string || 'en';
      const errorMessages = {
        en: 'Invalid credentials',
        fr: 'Identifiants invalides'
      };
      return res.status(401).json({ error: errorMessages[lang as keyof typeof errorMessages] });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isPasswordValid) {
      const lang = req.query.lang as string || 'en';
      const errorMessages = {
        en: 'Invalid credentials',
        fr: 'Identifiants invalides'
      };
      return res.status(401).json({ error: errorMessages[lang as keyof typeof errorMessages] });
    }

    // Remove password from response
    const { encrypted_password: _, ...userWithoutPassword } = user;

    // Set auth cookie
    const simpleToken = user.id;
    res.cookie('auth', simpleToken, {
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
    const lang = req.query.lang as string || 'en';
    const errorMessages = {
      en: 'Internal server error',
      fr: 'Erreur interne du serveur'
    };
    res.status(500).json({ error: errorMessages[lang as keyof typeof errorMessages] });
  }
});

// Get current user (me)
router.get('/me', (req: Request, res: Response) => {
  const authCookie = req.cookies?.auth;

  if (!authCookie) {
    const lang = req.query.lang as string || 'en';
    const errorMessages = {
      en: 'UNAUTHENTICATED',
      fr: 'NON_AUTHENTIFIÉ'
    };
    return res.status(401).json({ error: errorMessages[lang as keyof typeof errorMessages] });
  }

  // For now, fetch user by ID from cookie (simple; add validation)
  // In production, verify token properly
  prisma.user.findUnique({
    where: { id: authCookie },
  }).then((user) => {
    if (!user) {
      const lang = req.query.lang as string || 'en';
      const errorMessages = {
        en: 'Invalid token',
        fr: 'Jeton invalide'
      };
      return res.status(401).json({ error: errorMessages[lang as keyof typeof errorMessages] });
    }

    const { encrypted_password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
    });
  }).catch((err) => {
    console.error('Me error:', err);
    const lang = req.query.lang as string || 'en';
    const errorMessages = {
      en: 'Internal server error',
      fr: 'Erreur interne du serveur'
    };
    res.status(500).json({ error: errorMessages[lang as keyof typeof errorMessages] });
  });
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth');
  res.json({ success: true, message: 'Logged out' });
});

export default router;