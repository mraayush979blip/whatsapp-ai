import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    try {
        const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        const host = url.hostname; // e.g. xxx.supabase.co
        const [ref] = host.split('.');
        
        // Use Postgres REST API if possible? No. Let's just create a SQL RPC call to alter table.
    } catch(e) { }
}
run();
