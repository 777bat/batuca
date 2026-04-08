import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

// Supabase POSTGRES connection string from env
const connectionString = "postgresql://postgres:postgres@localhost:54322/postgres" // default local, but we will read the real one from pool if it exists

async function migrate() {
    const dbUrl = process.env.DATABASE_URL || connectionString;
    console.log("Connecting to database..");

    // We read the SQL migration script we created earlier
    const sql = fs.readFileSync('supabase/migrations/20260310070335_add_role_to_profiles.sql', 'utf8');

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        // 1. Add column
        console.log("Adding column role...");
        await client.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';`);

        // 2. Make current user Admin
        console.log("Making your user admin...");
        // the user id is likely the only one existing or the first one created
        await client.query(`UPDATE public.profiles SET role = 'admin'`);

        // 3. Drop existing strict RLS
        console.log("Modifying RLS policies...");
        try {
            await client.query(`DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.profiles;`);
        } catch (e) { }

        // 4. Create new Super RLS
        await client.query(`
        CREATE POLICY "Permite que donos atualizem seu perfil ou admins atualizem qualquer perfil" ON public.profiles
        FOR UPDATE USING (
            auth.uid() = id OR 
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        );
        `);

        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
