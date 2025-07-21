# DFS Manager Portal - Copilot Instructions

## Architecture Overview

This is a **React 18 + TypeScript + Vite** gas station management portal using **Supabase** as the backend. The app follows a **modular component architecture** with strict role-based access control.

### Key Systems
- **Authentication**: Custom AuthContext with Supabase auth + user profiles table
- **Database**: Supabase PostgreSQL with UUID-based schema (11 core tables)
- **State Management**: React Query + Context API (no Redux)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui components
- **Routing**: React Router with lazy-loaded feature pages

## Critical Development Patterns

### Component Structure
```
src/
├── components/         # Reusable UI (300+ components)
├── pages/             # Route-level pages (lazy loaded)
├── contexts/          # Global state (Auth, ModuleAccess, ErrorNotification)
├── services/          # Supabase adapters & external APIs
├── hooks/             # Custom React hooks
└── lib/               # Config (supabase client, utils)
```

### Database Integration
- **Primary Service**: `src/services/supabase/supabaseAdapter.ts` - ALL database operations go through this
- **Schema**: UUID-based with enum types (`user_role`, `station_status`, etc.)
- **Authentication**: Supabase Auth + custom `user_profiles` table for role/permissions
- **Real-time**: Use Supabase subscriptions for live updates

### Key Scripts & Commands
```bash
# Development with safety checks
npm run dev:safe          # Lints + type-checks before starting
npm run build:safe        # Quality checks before building
npm run quality-check     # Full lint + type + import validation

# Database operations
node scripts/migrate-supabase.js        # Run database migrations
node scripts/fix-permissions.js         # Fix file permissions (runs before build)
```

### Authentication & Authorization
- Users authenticate via Supabase Auth, then system loads `user_profiles` record
- Roles: `admin`, `manager`, `employee`, `viewer` (enum type)
- Access control via `ModuleAccessContext` - check permissions before rendering features
- Station-scoped access: Users belong to specific stations

### Error Handling Patterns
- **ErrorBoundary**: Wrap all lazy-loaded routes with `ErrorBoundaryWithNotifications`
- **Service Layer**: All database calls return `{success, data, error}` format
- **Toast Notifications**: Use `useToast()` hook for user feedback
- **Audit Logging**: Critical actions logged via `AuditLoggerService.getInstance()`

## Environment & Deployment

### Required Environment Variables
```bash
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Supabase anonymous key
VITE_DEFAULT_STATION=      # Default station ID (usually "MOBIL")
```

### Deployment Targets
- **Netlify** (primary): `npm run deploy:netlify`
- **Vercel**: `npm run deploy:vercel` 
- **Docker**: `npm run docker:build && npm run docker:run`

## Code Generation Guidelines

### Component Creation
- Use lazy loading for feature pages: `const Page = lazy(() => import('./Page'))`
- Wrap forms with `ErrorBoundary` and use `react-hook-form`
- Follow naming: `PageName.tsx` for pages, `ComponentName.tsx` for components

### Database Operations
- Always use `supabaseAdapter` for database calls
- Handle loading states and error boundaries
- Use React Query for caching: `import { useQuery, useMutation } from '@tanstack/react-query'`

### Styling
- Use Tailwind utility classes
- Import shadcn/ui components from `@/components/ui/`
- Responsive design: Mobile-first approach with responsive utilities

### File Organization
- Keep related components in feature folders under `src/pages/`
- Shared components go in `src/components/`
- Services and API calls in `src/services/`
- Use absolute imports with `@/` prefix

## Common Integration Points

### SMS/Alerts
- Service: `src/services/enhancedSmsService.ts`
- Configuration: Admin panel SMS management
- Alert triggers: Low inventory, license expiration

### File Uploads
- Image compression built-in via `src/components/EnhancedFileUpload.tsx`
- Supports profile pictures, ID documents, product images
- Uses Supabase Storage

### Real-time Features
- Dashboard analytics updates
- Live notifications
- Multi-user permission changes

## Anti-patterns to Avoid
- Don't bypass `supabaseAdapter` for direct Supabase calls
- Don't create new Context providers without considering existing ones
- Don't skip lazy loading for new feature pages
- Don't hardcode station references (use context/props)
- Don't forget to run `npm run quality-check` before commits
