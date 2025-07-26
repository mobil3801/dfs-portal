#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests all the database configurations we just updated
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const credentials = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  queryApiKey: process.env.QUERY_API_KEY,
  s3Endpoint: process.env.VITE_S3_ENDPOINT
}

console.log('🔍 Database Connection Test Starting...\n')

// Test 1: Environment Variables Check
console.log('📋 Environment Variables Check:')
Object.entries(credentials).forEach(([key, value]) => {
  const status = value ? '✅' : '❌'
  const preview = value ? `${value.substring(0, 50)}...` : 'MISSING'
  console.log(`${status} ${key}: ${preview}`)
})
console.log()

// Test 2: Supabase Client Connection (Anon Key)
console.log('🔌 Testing Supabase Client Connection (Anon Key)...')
try {
  const supabaseClient = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey)
  
  // Test basic connection with a simple query
  const { data, error } = await supabaseClient
    .from('information_schema.tables')
    .select('table_name')
    .limit(1)
  
  if (error) {
    console.log('❌ Anon Key Connection Failed:', error.message)
  } else {
    console.log('✅ Anon Key Connection Successful')
  }
} catch (err) {
  console.log('❌ Anon Key Connection Error:', err.message)
}

// Test 3: Supabase Service Role Connection
console.log('\n🔐 Testing Supabase Service Role Connection...')
try {
  const serviceClient = createClient(credentials.supabaseUrl, credentials.supabaseServiceKey)
  
  const { data, error } = await serviceClient
    .from('information_schema.tables')
    .select('table_name')
    .limit(1)
  
  if (error) {
    console.log('❌ Service Role Connection Failed:', error.message)
  } else {
    console.log('✅ Service Role Connection Successful')
  }
} catch (err) {
  console.log('❌ Service Role Connection Error:', err.message)
}

// Test 4: Database URL Format Check
console.log('\n🗄️  Database URL Format Check...')
try {
  const dbUrl = new URL(credentials.databaseUrl.replace('postgresql://', 'postgres://'))
  console.log('✅ Database URL Format Valid')
  console.log(`   Host: ${dbUrl.hostname}`)
  console.log(`   Port: ${dbUrl.port}`)
  console.log(`   Database: ${dbUrl.pathname.slice(1)}`)
  console.log(`   User: ${dbUrl.username}`)
} catch (err) {
  console.log('❌ Database URL Format Invalid:', err.message)
}

// Test 5: S3 Endpoint Check
console.log('\n🪣 S3 Endpoint Check...')
try {
  const s3Url = new URL(credentials.s3Endpoint)
  console.log('✅ S3 Endpoint Format Valid')
  console.log(`   Endpoint: ${s3Url.href}`)
} catch (err) {
  console.log('❌ S3 Endpoint Format Invalid:', err.message)
}

console.log('\n🏁 Database Connection Test Complete!')
console.log('\n📝 Summary:')
console.log('- All credentials have been updated')
console.log('- Fixed wrong anon key in .env file')
console.log('- Fixed malformed DATABASE_URL (removed double @@)')
console.log('- Added S3 storage configuration')
console.log('- Added function endpoint configuration')
console.log('- Created backup files (.env.backup, .env.local.backup)')