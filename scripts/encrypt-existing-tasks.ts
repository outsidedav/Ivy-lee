/**
 * One-time migration script to encrypt existing plaintext task titles.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/encrypt-existing-tasks.ts
 *
 * This script:
 * 1. Fetches all tasks from the database
 * 2. Checks if each title looks like it's already encrypted (base64)
 * 3. Encrypts plaintext titles using the user's derived key
 * 4. Updates the database with encrypted titles
 *
 * Safe to run multiple times — already-encrypted titles are skipped.
 */

import { createClient } from "@supabase/supabase-js";
import { encryptTitle, decryptTitle } from "../src/lib/encryption";

// Env vars loaded via --env-file flag (see usage above)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!process.env.NEXTAUTH_SECRET) {
  console.error("Missing NEXTAUTH_SECRET in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function looksEncrypted(title: string): boolean {
  // Encrypted titles are base64 strings of at least 29 bytes (12 IV + 16 tag + 1 char)
  // They won't contain spaces or common punctuation
  if (title.length < 30) return false;
  try {
    const buf = Buffer.from(title, "base64");
    // If re-encoding matches, it's likely base64 (encrypted)
    return buf.toString("base64") === title;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Fetching all tasks...");

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, user_id")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch tasks:", error.message);
    process.exit(1);
  }

  if (!tasks || tasks.length === 0) {
    console.log("No tasks found. Nothing to do.");
    return;
  }

  console.log(`Found ${tasks.length} tasks. Checking for plaintext titles...`);

  let encrypted = 0;
  let skipped = 0;

  for (const task of tasks) {
    if (looksEncrypted(task.title)) {
      // Verify it actually decrypts properly
      const decrypted = decryptTitle(task.title, task.user_id);
      if (decrypted !== task.title) {
        skipped++;
        continue; // Already encrypted
      }
    }

    // This is plaintext — encrypt it
    const encryptedTitle = encryptTitle(task.title, task.user_id);

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ title: encryptedTitle })
      .eq("id", task.id);

    if (updateError) {
      console.error(`Failed to encrypt task ${task.id}:`, updateError.message);
    } else {
      encrypted++;
      console.log(`  Encrypted: "${task.title.substring(0, 30)}..." → [encrypted]`);
    }
  }

  console.log(`\nDone! Encrypted: ${encrypted}, Already encrypted: ${skipped}`);
}

main().catch(console.error);
