#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');

const checks = [
  {
    name: 'Environment file exists (.env)',
    pass: fs.existsSync(envPath),
    help: 'Copy .env.example to .env and fill values.'
  }
];

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

const readEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');

checks.push(
  {
    name: 'VITE_SUPABASE_URL configured',
    pass: Boolean(supabaseUrl && !supabaseUrl.includes('your-project-ref')),
    help: 'Set your real Supabase project URL in .env.'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY configured',
    pass: Boolean(anonKey && !anonKey.includes('your-anon-public-key')),
    help: 'Set your real anon key from Supabase Project Settings → API.'
  },
  {
    name: 'Supabase migration file exists',
    pass: fs.existsSync(path.join(cwd, 'supabase/migrations/001_init.sql')),
    help: 'Ensure the baseline SQL migration file is present.'
  }
);

const allPassed = checks.every((check) => check.pass);

console.log('\nFSU Toolkit setup check\n');
for (const check of checks) {
  const icon = check.pass ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  if (!check.pass) {
    console.log(`   ↳ ${check.help}`);
  }
}

console.log('');
if (allPassed) {
  console.log('All checks passed. You can run: npm run dev\n');
  process.exit(0);
}

console.log('Setup incomplete. Fix the failed checks above, then re-run: npm run setup:check\n');
process.exit(1);
