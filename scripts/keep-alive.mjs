/**
 * Supabase Keep-Alive Script
 * 
 * Pings your Supabase database every 4 days to prevent it from pausing
 * on the free tier (which pauses after 7 days of inactivity).
 * 
 * Usage:
 *   node scripts/keep-alive.mjs          (single ping)
 *   node scripts/keep-alive.mjs --loop   (continuous, pings every 4 days)
 */

const SUPABASE_URL = 'https://ybbdnyszdfvlbxlfdtvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYmRueXN6ZGZ2bGJ4bGZkdHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjM3MzcsImV4cCI6MjA4MTkzOTczN30.YnwtSdn2LfPt6oEq6TilIGIdJ1qkUfhE-uDkhUI3R08';

// Ping interval: 4 days in milliseconds
const PING_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000;

async function ping() {
    const timestamp = new Date().toISOString();
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });
        console.log(`[${timestamp}] ✅ Supabase ping: ${response.status} ${response.statusText}`);
        return true;
    } catch (error) {
        console.error(`[${timestamp}] ❌ Supabase ping failed:`, error.message);
        return false;
    }
}

async function main() {
    const isLoop = process.argv.includes('--loop');

    console.log('🏓 Supabase Keep-Alive');
    console.log(`   Project: ${SUPABASE_URL}`);
    console.log(`   Mode: ${isLoop ? 'Continuous (every 4 days)' : 'Single ping'}`);
    console.log('');

    // Initial ping
    await ping();

    if (isLoop) {
        console.log(`\n⏰ Next ping in 4 days. Keep this terminal open.\n`);
        setInterval(ping, PING_INTERVAL_MS);
    }
}

main();
