This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API Client Generation

This project uses OpenAPI Generator to automatically generate TypeScript API clients from the Pecus WebApi Swagger specification.

### Generating API Clients

1. **Download the latest API specification:**
   ```bash
   npm run download:api
   ```

2. **Generate TypeScript API classes:**
   ```bash
   npm run generate:api
   ```

3. **Generate the PecusApiClient.ts file:**
   ```bash
   npm run generate:client
   ```

The `generate:client` script automatically scans the `src/connectors/api/pecus/` directory and creates a unified client factory that provides access to all API endpoints with proper authentication handling.

### API Usage

```typescript
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

const clients = createPecusApiClients();

// Example usage
const organizations = await clients.adminOrganization.apiAdminOrganizationGet();
const users = await clients.adminUser.apiAdminUserGet();
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
