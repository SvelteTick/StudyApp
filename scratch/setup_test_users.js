const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Error: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Starting test users creation...');
  // We'll create 50 users
  for (let i = 1; i <= 50; i++) {
    const email = `test${i}@example.com`;
    const password = `password123`;

    // 1. SignUp / Admin Create User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `test${i}` }
    });

    if (authError) {
      console.log(`[Error] User ${i}: ${authError.message}`);
      continue;
    }

    const userId = authData.user.id;
    console.log(`Created user test${i} with ID ${userId}`);

    // Wait a couple seconds to allow trigger to run
    // Since handle_new_user trigger inserts into public.user_progress on users insert
    await new Promise(r => setTimeout(r, 1000));

    // Update their XP in user_progress to populate leaderboard
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        total_xp_earned: (51 - i) * 100, // test1 gets 5000 XP, test50 gets 100 XP
        level: 1 + Math.floor((51 - i) / 5)
      })
      .eq('id', userId);

    if (updateError) {
      console.log(`[Error] Update XP for user ${i}: ${updateError.message}`);
    } else {
      console.log(`Updated XP for user test${i}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
