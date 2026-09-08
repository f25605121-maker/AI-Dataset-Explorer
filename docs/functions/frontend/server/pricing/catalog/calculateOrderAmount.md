# calculateOrderAmount

**File:** `src\server\pricing\catalog.ts`

## Description
Server-authoritative pricing catalog.
Prevents client-side price tampering by resolving all amounts, currencies,
and discount calculations strictly on the server.
/

export interface PricingPlan {
    id: string;
    name: string;
    monthlyPriceCents: number;
    yearlyPriceCents: number;
    currency: string;
    features: string[];
    aiQueryQuotaDaily: number;
    aiTokenQuotaDaily: number;
}

export const SERVER_PRICING_CATALOG: Record<string, PricingPlan> = {
    free: {
        id: 'free',
        name: 'Community',
        monthlyPriceCents: 0,
        yearlyPriceCents: 0,
        currency: 'usd',
        features: ['50 AI Queries / day', 'Public Datasets', 'Community Support'],
        aiQueryQuotaDaily: 50,
        aiTokenQuotaDaily: 50_000,
    },
    pro: {
        id: 'pro',
        name: 'Pro Researcher',
        monthlyPriceCents: 2900, // $29.00
        yearlyPriceCents: 29000, // $290.00
        currency: 'usd',
        features: ['Unlimited AI Searches', 'Private Datasets', 'Fast Pipeline Priority', 'Export Capabilities'],
        aiQueryQuotaDaily: 500,
        aiTokenQuotaDaily: 500_000,
    },
    team: {
        id: 'team',
        name: 'Team Collaboration',
        monthlyPriceCents: 7900, // $79.00
        yearlyPriceCents: 79000, // $790.00
        currency: 'usd',
        features: ['5 Team Seats', 'Shared Dataset Repositories', 'Role Based Access Control'],
        aiQueryQuotaDaily: 2000,
        aiTokenQuotaDaily: 2_000_000,
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise Scale',
        monthlyPriceCents: 29900, // $299.00
        yearlyPriceCents: 299000, // $2990.00
        currency: 'usd',
        features: ['Dedicated Cluster', 'SLA 99.9%', 'Custom LLM Fine-tuning', 'Audit Logging'],
        aiQueryQuotaDaily: 10000,
        aiTokenQuotaDaily: 10_000_000,
    },
};

const VALID_DISCOUNT_CODES: Record<string, number> = {
    'RESEARCH20': 20, // 20% discount
    'STUDENT50': 50,  // 50% discount
};

export interface OrderCalculation {
    planId: string;
    planName: string;
    billingInterval: 'monthly' | 'yearly';
    baseAmountCents: number;
    discountPercent: number;
    discountAmountCents: number;
    finalAmountCents: number;
    currency: string;
}

/**
Calculates checkout total strictly based on server-side pricing catalog.
Any client-supplied amount or price fields are strictly ignored.

## Signature
```typescript
function calculateOrderAmount(planId: string,
    billingInterval: 'monthly' | 'yearly' = 'monthly',
    couponCode?: string): OrderCalculation
```
