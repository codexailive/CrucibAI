import { OverageDetectionService } from '../services/overage/OverageDetectionService';
import { OverageBillingService } from '../services/overage/OverageBillingService';
import { SubscriptionService } from '../services/billing/SubscriptionService';

// Run daily at midnight
export const dailyJobs = [
  {
    name: 'Check usage overages',
    schedule: '0 0 * * *',
    handler: async () => {
      const service = new OverageDetectionService();
      await service.checkAllUsersForOverages();
    }
  },
  {
    name: 'Process monthly billing',
    schedule: '0 0 1 * *',
    handler: async () => {
      const service = new OverageBillingService();
      await service.processMonthlyOverageBilling();
    }
  },
  {
    name: 'Process subscription renewals',
    schedule: '0 0 * * *',
    handler: async () => {
      const service = new SubscriptionService();
      await service.processRenewals();
    }
  }
];
