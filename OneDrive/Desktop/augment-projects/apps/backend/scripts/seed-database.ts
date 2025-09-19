import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create subscription tiers
  const subscriptions = await Promise.all([
    prisma.subscription.upsert({
      where: { tier: 'DISCOVERY' },
      update: {},
      create: {
        name: 'Discovery',
        description: 'Free tier for exploring the platform',
        tier: 'DISCOVERY',
        amount: 0,
        currency: 'USD',
        features: JSON.stringify([
          '20 AI calls per month',
          '2 quantum simulations',
          'Community support',
          'Basic analytics'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'STARTER' },
      update: {},
      create: {
        name: 'Starter',
        description: 'Perfect for individuals and small projects',
        tier: 'STARTER',
        amount: 29,
        currency: 'USD',
        features: JSON.stringify([
          '250 AI calls per month',
          '5 quantum simulations',
          '1 deployment',
          'Email support',
          'Advanced analytics'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'PROFESSIONAL' },
      update: {},
      create: {
        name: 'Professional',
        description: 'For professionals and growing teams',
        tier: 'PROFESSIONAL',
        amount: 59,
        currency: 'USD',
        features: JSON.stringify([
          '500 AI calls per month',
          '10 quantum simulations',
          '2 deployments',
          'Priority support',
          'Custom analytics'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'BUSINESS' },
      update: {},
      create: {
        name: 'Business',
        description: 'For businesses with advanced needs',
        tier: 'BUSINESS',
        amount: 149,
        currency: 'USD',
        features: JSON.stringify([
          '1,200 AI calls per month',
          '20 quantum simulations',
          '5 deployments',
          '24/7 support',
          'Custom integrations'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'TEAM' },
      update: {},
      create: {
        name: 'Team',
        description: 'For teams and organizations',
        tier: 'TEAM',
        amount: 399,
        currency: 'USD',
        features: JSON.stringify([
          '3,000 AI calls per month',
          '50 quantum simulations',
          '10 deployments',
          'Dedicated support',
          'Team collaboration'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'ENTERPRISE' },
      update: {},
      create: {
        name: 'Enterprise',
        description: 'For large enterprises',
        tier: 'ENTERPRISE',
        amount: 999,
        currency: 'USD',
        features: JSON.stringify([
          '10,000 AI calls per month',
          '200 quantum simulations',
          '25 deployments',
          'Enterprise support',
          'Custom solutions'
        ])
      }
    }),
    prisma.subscription.upsert({
      where: { tier: 'UNLIMITED' },
      update: {},
      create: {
        name: 'Unlimited',
        description: 'For unlimited access and custom requirements',
        tier: 'UNLIMITED',
        amount: 2499,
        currency: 'USD',
        features: JSON.stringify([
          '50,000 AI calls per month',
          '1,000 quantum simulations',
          '100 deployments',
          'White-glove support',
          'Unlimited everything'
        ])
      }
    })
  ]);

  // Create knowledge base articles
  const knowledgeBaseArticles = await Promise.all([
    prisma.knowledgeBaseArticle.upsert({
      where: { title: 'Getting Started with CrucibleAI' },
      update: {},
      create: {
        title: 'Getting Started with CrucibleAI',
        content: 'Welcome to CrucibleAI! This guide will help you get started with our platform...',
        category: 'Getting Started',
        tags: ['beginner', 'tutorial', 'guide'],
        isPublished: true
      }
    }),
    prisma.knowledgeBaseArticle.upsert({
      where: { title: 'Understanding AI Models' },
      update: {},
      create: {
        title: 'Understanding AI Models',
        content: 'CrucibleAI supports multiple AI providers. Learn how to choose the right model...',
        category: 'AI',
        tags: ['ai', 'models', 'guide'],
        isPublished: true
      }
    }),
    prisma.knowledgeBaseArticle.upsert({
      where: { title: 'Quantum Computing Basics' },
      update: {},
      create: {
        title: 'Quantum Computing Basics',
        content: 'Quantum computing is a revolutionary technology. Learn how to use it...',
        category: 'Quantum',
        tags: ['quantum', 'computing', 'tutorial'],
        isPublished: true
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created ${subscriptions.length} subscription tiers`);
  console.log(`📚 Created ${knowledgeBaseArticles.length} knowledge base articles`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
