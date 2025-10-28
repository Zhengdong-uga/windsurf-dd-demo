# Quick Start Guide

Get your AI chatbot running in 5 minutes!

## Deploy to Vercel (Fastest)

Click the button below to deploy with all required services:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/your-repo&env=OPENAI_API_KEY,AUTH_SECRET&envDescription=API%20keys%20needed%20for%20the%20application&envLink=https://github.com/yourusername/your-repo/blob/main/VERCEL_DEPLOYMENT_GUIDE.md&stores=[{"type":"postgres"},{"type":"blob"},{"type":"kv"}])

During deployment, you'll be prompted for:

1. **OPENAI_API_KEY**: Get from [platform.openai.com/api-keys](https://platform.openai.com/account/api-keys)
2. **AUTH_SECRET**: Generate at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

Vercel will automatically create:
- ✅ Postgres database
- ✅ Blob storage
- ✅ KV Redis

**Post-Deployment**: Copy `KV_URL` to `REDIS_URL` in environment variables (see [deployment guide](./VERCEL_DEPLOYMENT_GUIDE.md#23-create-vercel-kv-redis-optional-but-recommended)).

## Local Development

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`corepack enable`)
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd windsurf-dd-demo

# Install dependencies
pnpm install

# Link to Vercel (if already deployed)
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# OR create .env.local manually:
cat > .env.local << EOF
OPENAI_API_KEY=sk-...
AUTH_SECRET=your-secret-here
POSTGRES_URL=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
REDIS_URL=redis://...
EOF

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Without Vercel Services (Local Only)

For pure local development without Vercel services:

```bash
# Install dependencies
pnpm install

# Create .env.local with just OpenAI
cat > .env.local << EOF
OPENAI_API_KEY=sk-...
AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_URL=postgresql://user:password@localhost:5432/chatbot
EOF

# Set up local Postgres (using Docker)
docker run -d \
  --name chatbot-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=chatbot \
  -p 5432:5432 \
  postgres:15

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

**Note**: Without Blob storage, file uploads will fail. Without Redis, resumable streams won't work.

## Database Management

```bash
# Generate new migration after schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Push schema directly (dev only, skip migrations)
pnpm db:push
```

## Customization

### Change AI Models

Edit `lib/ai/providers.ts`:

```typescript
customProvider({
  languageModels: {
    "chat-model": openai("gpt-4o"),      // Change to gpt-4, claude-3, etc.
    "chat-model-reasoning": wrapLanguageModel({
      model: openai("o1-mini"),          // Reasoning model
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openai("gpt-4o-mini"), // Title generation
    "artifact-model": openai("gpt-4o"),   // Artifact generation
  },
})
```

### Add Custom Tools

Create a new tool in `lib/ai/tools/`:

```typescript
// lib/ai/tools/my-tool.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Description of what your tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Your tool logic here
    return { result: "Tool output" };
  },
});
```

Then add it to the chat route in `app/(chat)/api/chat/route.ts`:

```typescript
import { myTool } from "@/lib/ai/tools/my-tool";

// In the POST handler
const result = streamText({
  // ...
  tools: {
    createDocument,
    updateDocument,
    getWeather,
    requestSuggestions,
    myTool,  // Add your tool here
  },
});
```

## Environment Variables

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key | [platform.openai.com/api-keys](https://platform.openai.com/account/api-keys) |
| `AUTH_SECRET` | Yes | NextAuth secret | [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `POSTGRES_URL` | Yes | PostgreSQL connection | Vercel auto-adds or local setup |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Blob storage token | Vercel auto-adds |
| `REDIS_URL` | Optional | Redis connection | Copy from Vercel `KV_URL` |

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Database Connection Failed

```bash
# Verify POSTGRES_URL is set
echo $POSTGRES_URL

# Test connection
psql $POSTGRES_URL -c "SELECT 1"

# Reset database (⚠️ deletes all data)
pnpm db:push --force
```

### OpenAI Rate Limits

- Check your OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- Add credits if needed
- Consider using `gpt-4o-mini` for development (cheaper)

## Testing

```bash
# Run tests
pnpm test

# Run specific test
pnpm test -- tests/chat.spec.ts

# Run tests in UI mode
pnpm test -- --ui
```

## Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Next Steps

1. ✅ [Read the full deployment guide](./VERCEL_DEPLOYMENT_GUIDE.md)
2. ✅ Customize the UI in `/components`
3. ✅ Add your own AI tools
4. ✅ Configure authentication providers
5. ✅ Set up monitoring and analytics

## Resources

- [Full Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
