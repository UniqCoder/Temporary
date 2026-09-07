-- Identity moves to Supabase Auth: drop the local User/Session tables and the
-- FK from Memory, which now just carries an opaque Supabase user id.

-- DropForeignKey
ALTER TABLE "Memory" DROP CONSTRAINT IF EXISTS "Memory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Session";

-- DropTable
DROP TABLE IF EXISTS "User";
