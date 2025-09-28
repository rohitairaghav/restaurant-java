#!/usr/bin/env node

/**
 * Script to create Supabase Auth users for testing
 *
 * This script creates actual auth users that can login, then updates the user_profiles
 * table to link them to the test data we've already created.
 *
 * Run this after applying the Liquibase migrations with test data.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from web app
dotenv.config({ path: path.join(process.cwd(), '../../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // This should be the service role key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key for user management
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'manager@demobistro.com',
    password: 'Demo123!',
    user_metadata: {
      role: 'manager',
      restaurant_name: 'Demo Italian Bistro'
    },
    profile_id: 'f8ab456c-a10d-41f7-a801-576d3473582b'
  },
  {
    email: 'staff@demobistro.com',
    password: 'Demo123!',
    user_metadata: {
      role: 'staff',
      restaurant_name: 'Demo Italian Bistro'
    },
    profile_id: '1522f9e5-85f3-4c45-a46e-68b3c8ec7ebd'
  },
  {
    email: 'chef@pizzapalace.com',
    password: 'Demo123!',
    user_metadata: {
      role: 'manager',
      restaurant_name: 'Test Pizza Palace'
    },
    profile_id: '5667d95f-b23f-4b57-a871-b9d240a09a6c'
  },
  {
    email: 'server@sushi.com',
    password: 'Demo123!',
    user_metadata: {
      role: 'staff',
      restaurant_name: 'Sample Sushi Bar'
    },
    profile_id: '486003c8-aaa3-47dc-9d0e-c700127391f7'
  }
]

async function createAuthUsers() {
  console.log('🚀 Creating Supabase Auth users for testing...\n')

  for (const user of testUsers) {
    try {
      console.log(`📧 Creating user: ${user.email}`)

      // Create the auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true // Auto-confirm email for testing
      })

      if (authError) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ Auth user created with ID: ${authUser.user.id}`)

      // Update the user_profiles table to link to the actual auth user ID
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ id: authUser.user.id })
        .eq('id', user.profile_id)

      if (profileError) {
        console.error(`❌ Failed to update user profile for ${user.email}:`, profileError.message)
        // Try to delete the auth user if profile update failed
        await supabase.auth.admin.deleteUser(authUser.user.id)
        continue
      }

      console.log(`✅ User profile linked successfully`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Password: ${user.password}`)
      console.log(`   Role: ${user.user_metadata.role}`)
      console.log('')

    } catch (error) {
      console.error(`❌ Unexpected error creating user ${user.email}:`, error.message)
    }
  }

  console.log('🎉 Auth user creation completed!')
  console.log('\n📋 Test Credentials:')
  console.log('==================')
  testUsers.forEach(user => {
    console.log(`${user.email} / ${user.password} (${user.user_metadata.role})`)
  })
  console.log('\n🔐 You can now login with any of these credentials.')
}

async function main() {
  try {
    await createAuthUsers()
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

main()