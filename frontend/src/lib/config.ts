export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000,
  },
  app: {
    name: 'Hotel Management System',
    version: '1.0.0',
  },
} as const;
