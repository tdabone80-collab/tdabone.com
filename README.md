This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Database / Migrations

This project uses Drizzle ORM and `drizzle-kit` for schema and migrations. Configuration is in `drizzle.config.ts` and the schema file is `lib/schema.ts`.

Quick workflow:

1. Copy `.env.example` to `.env` and set `DATABASE_URL`:

```bash
cp .env.example .env
# edit .env and set DATABASE_URL
```

2. Generate a migration (creates SQL in the `drizzle` folder):

```bash
npm run db:generate -- --name init
```

3. Apply migrations to your database:

```bash
npm run db:migrate
```

If you prefer to push the current schema directly (destructive on target), use:

```bash
npm run db:push
```

4. To run the Drizzle Studio for visual schema browsing:

```bash
npm run db:studio
```

Notes:
- `drizzle-kit generate` reads `lib/schema.ts` and writes SQL migration files to the `out` directory configured in `drizzle.config.ts`.
- Make sure `DATABASE_URL` is set in your environment when running `db:migrate` or `db:push`.
- For CI or deployments (Vercel), set `DATABASE_URL` in your project environment variables.

## Clerk Webhooks (optional, recommended)

If you want Clerk to notify your app when users change (so the local DB stays in sync), register a webhook that points to:

	- <your-deploy-url>/api/webhooks/clerk

Recommended env var:

	- CLERK_WEBHOOK_SECRET — the signing secret from Clerk (used to verify webhook signatures).

The project includes a basic webhook handler at `app/api/webhooks/clerk/route.ts` which will call your sync helper when it sees user.created or user.updated events. The file contains comments about verifying the signature; enable verification in production.

