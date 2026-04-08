require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profile columns:', profiles ? Object.keys(profiles[0]) : 'none');

    const { data: plans } = await supabase.from('subscription_plans').select('*').limit(1);
    console.log('Plan columns:', plans ? Object.keys(plans[0]) : 'none');

    // See what other tables exist via information_schema
    const { data: tables } = await supabase.rpc('get_tables').catch(() => ({ data: 'rpc failed' }));
    console.log('Tables from RPC:', tables);
}
run();
