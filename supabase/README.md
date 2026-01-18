# Supabase Migrations

This directory contains SQL migrations for the SmartSpend database schema.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for Manual Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file you want to apply
4. Paste into the SQL editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (first time only)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Available Migrations

### 20260117_create_user_backups.sql

Creates the `user_backups` table for cloud backup storage (Phase 3).

**Features:**
- Stores complete backup files as JSONB
- Tracks backup metadata (type, size, checksum)
- Row Level Security (RLS) policies ensure users only see their own backups
- Automatic cleanup function for backups older than 30 days
- Indexes for fast retrieval

**To apply this migration manually:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `20260117_create_user_backups.sql`
3. Run the SQL
4. Verify the table exists in **Database → Tables**

## Scheduled Cleanup (Optional)

The migration includes a `cleanup_old_backups()` function that deletes backups older than 30 days. To run this automatically:

### Option A: Using pg_cron (if available)

```sql
SELECT cron.schedule(
  'cleanup-old-backups',
  '0 3 * * *',  -- Run daily at 3 AM UTC
  'SELECT cleanup_old_backups()'
);
```

### Option B: Using Supabase Edge Function

Create a scheduled Edge Function that calls the cleanup function daily.

### Option C: Manual Cleanup

You can also run the cleanup manually whenever needed:

```sql
SELECT cleanup_old_backups();
```

## Verifying the Migration

After applying the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM user_backups LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_backups';

-- Check if cleanup function exists
SELECT proname FROM pg_proc WHERE proname = 'cleanup_old_backups';
```

## Troubleshooting

**Error: relation "user_backups" already exists**
- The migration has already been applied. No action needed.

**Error: permission denied**
- Make sure you're running the migration as a superuser or database owner.

**Error: RLS policy already exists**
- The migration has already been applied. You can drop existing policies first:
  ```sql
  DROP POLICY IF EXISTS "Users can view own backups" ON user_backups;
  DROP POLICY IF EXISTS "Users can create own backups" ON user_backups;
  DROP POLICY IF EXISTS "Users can delete own backups" ON user_backups;
  ```

## Next Steps

After applying the migration:

1. Test backup creation in the app (authenticated user only)
2. Verify backups appear in `user_backups` table
3. Test restore functionality
4. Test delete functionality
5. (Optional) Set up automatic cleanup via pg_cron or Edge Function
