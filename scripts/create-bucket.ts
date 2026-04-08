import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();
    if (getError) {
        console.error("Error fetching buckets:", getError);
        return;
    }

    let hasAssets = buckets?.some(b => b.name === 'assets');
    if (!hasAssets) {
        const { data, error } = await supabase.storage.createBucket('assets', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
        });
        if (error) {
            console.error("Bucket creation error:", error);
        } else {
            console.log("Bucket assets created successfully!");
        }
    } else {
        console.log("Bucket 'assets' already exists.");
    }
}
createBucket();
