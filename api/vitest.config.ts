import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        DB: {},
        KV_SESSIONS: {},
        R2_BUCKET: {},
        STRIPE_SECRET_KEY: 'sk_test_dummy',
        STRIPE_WEBHOOK_SECRET: 'whsec_dummy',
        JWT_SECRET: 'test-secret-32-chars-long-for-jwt',
        RESEND_API_KEY: 're_test_dummy',
        VECTORIZE_INDEX: {},
        AI: {},
        EMAIL_QUEUE: {},
      },
      kvNamespaces: ['KV_SESSIONS'],
      r2Buckets: ['R2_BUCKET'],
      d1Databases: ['DB'],
      queueProducers: ['EMAIL_QUEUE'],
    },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/'],
    },
  },
});
