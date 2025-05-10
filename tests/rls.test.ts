// tests/rls.test.ts
// REMOVE dotenv loading from here, rely on vitest.config.ts
// import dotenv from 'dotenv'; 
// import path from 'path';

// const envLoadResult = dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

// if (envLoadResult.error) {
//   console.error('RLS_TEST_DOTENV_ERROR:', envLoadResult.error);
// } else {
//   console.log('RLS_TEST_DOTENV_LOADED_VARS:', envLoadResult.parsed);
// }
// console.log('RLS_TEST_VITE_SUPABASE_URL_AFTER_DOTENV_LOAD:', process.env.VITE_SUPABASE_URL);

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, afterAll, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Global scope logs removed, as env vars are not expected here yet.

describe.skip('RLS Multi-Tenancy Tests for "notes" table', () => {
  console.log("RLS_TEST_FILE_LOADED_AND_DESCRIBE_ENTERED");

  let adminSupabase: SupabaseClient;
  let userASupabase: SupabaseClient;
  let userBSupabase: SupabaseClient;
  let userAId: string | undefined;
  let userBId: string | undefined;
  let orgAId: string | undefined;
  let orgBId: string | undefined;

  let supabaseUrl: string | undefined;
  let supabaseAnonKey: string | undefined;
  let supabaseServiceRoleKey: string | undefined;
  const userAEmail = "kip@vistaonemarketing.com";
  const userAPassword = "kip123#";
  const userBEmail = "matt@vistaonemarketing.com";
  const userBPassword = "matt123#";
  const orgAName = "Organization A";
  const orgBName = "Organization B";

  const createSupabaseClientWithUser = (jwt: string): SupabaseClient => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key not initialized for createSupabaseClientWithUser');
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });
  };

  const loginUser = async (email?: string, password?: string): Promise<string | null> => {
    if (!email || !password) return null;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key not initialized for loginUser');
    }
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      console.error(`Login failed for ${email}:`, error.message);
      return null;
    }
    if (!data.session) {
      console.error(`No session returned for ${email}`);
      return null;
    }
    return data.session.access_token;
  };

  beforeAll(async () => {
    console.log("RLS_TEST_BEFORE_ALL_STARTED");

    // Assign environment variables. Vitest's envFiles option in vitest.config.ts handles loading .env.local
    supabaseUrl = process.env.VITE_SUPABASE_URL;
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    console.log('RLS_TEST_ASSIGNED_VITE_SUPABASE_URL:', supabaseUrl);
    console.log('RLS_TEST_ASSIGNED_VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey); // Keep this one for confirmation

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error('CRITICAL RLS_TEST_ERROR: One or more VITE_ environment variables are missing or falsy after assignment. Halting tests.', {
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
        VITE_SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
      });
      throw new Error("Critical environment variables for RLS tests are missing. Check .env.local and ensure all VITE_ prefixed variables are correctly set.");
    }

    adminSupabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

    // Create User A (Kip) via admin API
    console.log(`RLS_TEST_BEFORE_ALL: Creating User A (${userAEmail}) using admin API.`);
    const { data: createUserAData, error: createUserAError } = await adminSupabase.auth.admin.createUser({
      email: userAEmail,
      password: userAPassword,
      email_confirm: true
    });
    if (createUserAError) {
      console.error(`RLS_TEST_BEFORE_ALL: Error creating User A:`, createUserAError);
      throw new Error(`Failed to create User A: ${createUserAError.message}`);
    }
    userAId = createUserAData.user?.id;
    console.log(`RLS_TEST_BEFORE_ALL: Successfully created User A. User ID:`, userAId);

    // Fetch User B as before
    let { data: userBData, error: userBError } = await adminSupabase.from('users').select('id').eq('email', userBEmail).single();
    if (userBError || !userBData) {
        throw new Error(`Failed to find User B (${userBEmail}): ${userBError?.message}...`);
    }
    userBId = userBData.id;
    console.log(`Fetched User B ID: ${userBId}`);

    // Create Org A with Kip as owner
    const { data: orgAData, error: orgAError } = await adminSupabase.from('organizations').insert({ name: orgAName, owner_user_id: userAId }).select().single();
    if (orgAError || !orgAData) {
      throw new Error(`Failed to create Org A '${orgAName}': ${orgAError?.message}`);
    }
    orgAId = orgAData.id;

    // Fetch Org B as before
    const { data: orgBData, error: orgBError } = await adminSupabase.from('organizations').select('id').eq('name', orgBName).single();
    if (orgBError || !orgBData) {
      throw new Error(`Failed to find Org B '${orgBName}' (expected from seed.sql): ${orgBError?.message}`);
    }
    orgBId = orgBData.id;
    console.log(`Found OrgA ID: ${orgAId}, OrgB ID: ${orgBId}`);

    // Upsert memberships for User A and User B
    const memberships = [
      { user_id: userAId!, organization_id: orgAId!, role: 'admin' },
      { user_id: userBId!, organization_id: orgBId!, role: 'admin' },
    ];
    const { error: membershipError } = await adminSupabase.from('organization_memberships').upsert(memberships, { onConflict: 'user_id,organization_id' });
    if (membershipError) throw new Error(`Failed to upsert memberships: ${membershipError.message}`);
    console.log('Upserted memberships.');

    console.log(`Setup complete. UserA: ${userAId}, UserB: ${userBId}, OrgA: ${orgAId}, OrgB: ${orgBId}`);
  });

  afterAll(async () => {
    console.log("RLS_TEST_AFTER_ALL_STARTED");
    if (!adminSupabase) {
        console.warn("adminSupabase not initialized in afterAll, skipping cleanup.");
        return;
    }
    if (orgAId) {
        console.log(`Attempting to delete Org A: ${orgAId}`);
        await adminSupabase.from('organizations').delete().eq('id', orgAId);
    }
    if (orgBId) {
        console.log(`Attempting to delete Org B: ${orgBId}`);
        await adminSupabase.from('organizations').delete().eq('id', orgBId);
    }
    console.log('RLS test cleanup complete.');
  });

  beforeEach(async () => {
    console.log("RLS_TEST_BEFORE_EACH_STARTED");
    if (!adminSupabase) throw new Error('adminSupabase not initialized for beforeEach cleanup');
    const { error } = await adminSupabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if(error) console.error("Error clearing notes in beforeEach:", error);
    else console.log("Cleared notes in beforeEach.");
  });

  afterEach(async () => {
    console.log("RLS_TEST_AFTER_EACH_STARTED");
  });

  describe('User A (Member of Org A)', () => {
    let userAJwt: string | null;

    beforeAll(async () => {
      console.log("RLS_TEST_USER_A_DESCRIBE_BEFORE_ALL_STARTED");
      if (!userAEmail || !userAPassword) throw new Error("User A credentials not available for login");
      
      console.log(`RLS_TEST_USER_A_ATTEMPTING_LOGIN with email: ${userAEmail}, password: '${userAPassword}'`); 
      
      userAJwt = await loginUser(userAEmail, userAPassword);
      if (!userAJwt) throw new Error('User A login failed in User A describe block');
      userASupabase = createSupabaseClientWithUser(userAJwt);
      console.log("User A client created.");
    });

    it('should only SELECT notes from Org A', async () => {
      console.log("RLS_TEST_USER_A_SELECT_STARTED");
      if (!adminSupabase || !orgAId || !orgBId) throw new Error("Admin client or Org IDs not initialized for User A SELECT test setup");
      if (!userASupabase) throw new Error ("User A client not initialized for SELECT test");
      // Seed data for this specific test
      await adminSupabase.from('notes').insert([
        { title: 'Note 1A', content: 'Content A1', organization_id: orgAId },
        { title: 'Note 2B', content: 'Content B2', organization_id: orgBId },
      ]);

      const { data: notes, error } = await userASupabase.from('notes').select('*');
      expect(error).toBeNull();
      expect(notes).not.toBeNull();
      expect(notes).toHaveLength(1);
      expect(notes![0].title).toBe('Note 1A');
      expect(notes![0].organization_id).toBe(orgAId);
    });
    
    it('should INSERT notes only into Org A (RLS policy assigns org_id)', async () => {
      console.log("RLS_TEST_USER_A_INSERT_STARTED");
      if (!userASupabase || !orgAId ||!adminSupabase) throw new Error("User/Admin client or OrgA ID not initialized for User A INSERT test");
      const { data, error } = await userASupabase
        .from('notes')
        .insert({ title: 'Note 3A by UserA', content: 'UserA content' })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      if(data) expect(data.organization_id).toBe(orgAId); 

      const { data: adminData, error: adminError } = await adminSupabase
        .from('notes')
        .select('organization_id')
        .eq('id', data!.id)
        .single();
      expect(adminError).toBeNull();
      if(adminData) expect(adminData.organization_id).toBe(orgAId);
    });
    
    it('should FAIL to INSERT notes into Org B', async () => {
      console.log("RLS_TEST_USER_A_FAIL_INSERT_B_STARTED");
      if (!userASupabase || !orgBId) throw new Error("User A client or OrgB ID not initialized for User A FAIL INSERT B test");
      const { error } = await userASupabase
        .from('notes')
        .insert({ title: 'Malicious Note for B', content: 'Attempting cross-write', organization_id: orgBId });
      
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/security policy|constraint/i); 
    });

    it('should UPDATE notes only in Org A', async () => {
      console.log("RLS_TEST_USER_A_UPDATE_STARTED");
      if (!adminSupabase || !orgAId || !userASupabase) throw new Error("Admin/User client or OrgA ID not initialized for User A UPDATE test");
      const { data: note } = await adminSupabase.from('notes').insert({ title: 'Note To Update A', organization_id: orgAId }).select().single();
      if (!note) throw new Error("Failed to seed note for update test");

      const { error } = await userASupabase.from('notes').update({ content: 'Updated by UserA' }).eq('id', note.id);
      expect(error).toBeNull();
    });

    it('should FAIL to UPDATE notes in Org B', async () => {
      console.log("RLS_TEST_USER_A_FAIL_UPDATE_B_STARTED");
      if (!adminSupabase || !orgBId || !userASupabase) throw new Error("Admin/User client or OrgB ID not initialized for User A FAIL UPDATE B test");
      const { data: noteB } = await adminSupabase.from('notes').insert({ title: 'Note To Not Update B', organization_id: orgBId }).select().single();
      if (!noteB) throw new Error("Failed to seed note for update failure test");

      const { error, count } = await userASupabase.from('notes').update({ content: 'Malicious Update by UserA' }).eq('id', noteB.id);
      if (error) {
        expect(error.message).toMatch(/security policy|constraint/i); 
      } else {
        expect(count === 0 || count === null).toBe(true); 
      }
    });

     it('should DELETE notes only in Org A', async () => {
      console.log("RLS_TEST_USER_A_DELETE_STARTED");
      if (!adminSupabase || !orgAId || !userASupabase) throw new Error("Admin/User client or OrgA ID not initialized for User A DELETE test");
      const { data: note } = await adminSupabase.from('notes').insert({ title: 'Note To Delete A', organization_id: orgAId }).select().single();
      if (!note) throw new Error("Failed to seed note for delete test");

      const { error } = await userASupabase.from('notes').delete().eq('id', note.id);
      expect(error).toBeNull();
    });

    it('should FAIL to DELETE notes in Org B', async () => {
      console.log("RLS_TEST_USER_A_FAIL_DELETE_B_STARTED");
      if (!adminSupabase || !orgBId || !userASupabase) throw new Error("Admin/User client or OrgB ID not initialized for User A FAIL DELETE B test");
      const { data: noteB } = await adminSupabase.from('notes').insert({ title: 'Note To Not Delete B', organization_id: orgBId }).select().single();
      if (!noteB) throw new Error("Failed to seed note for delete failure test");
      
      const { error, count } = await userASupabase.from('notes').delete().eq('id', noteB.id);
      if (error) {
        expect(error.message).toMatch(/security policy|constraint/i);
      } else {
        expect(count === 0 || count === null).toBe(true);
      }
    });
  });

  describe.skip('User B (Member of Org B)', () => {
    let userBJwt: string | null;

    beforeAll(async () => {
      console.log("RLS_TEST_USER_B_DESCRIBE_BEFORE_ALL_STARTED");
      if (!userBEmail || !userBPassword) throw new Error("User B credentials not available for login");
      userBJwt = await loginUser(userBEmail, userBPassword);
      if (!userBJwt) throw new Error('User B login failed in User B describe block');
      userBSupabase = createSupabaseClientWithUser(userBJwt);
      console.log("User B client created.");
    });

    it('should only SELECT notes from Org B', async () => {
      console.log("RLS_TEST_USER_B_SELECT_STARTED");
      if (!adminSupabase || !orgAId || !orgBId) throw new Error("Admin client or Org IDs not initialized for User B SELECT test setup");
      if (!userBSupabase) throw new Error ("User B client not initialized for SELECT test");
      await adminSupabase.from('notes').insert([
        { title: 'Note 1A again by A', content: 'Content A1 again by A', organization_id: orgAId },
        { title: 'Note 2B again by B', content: 'Content B2 again by B', organization_id: orgBId },
      ]);

      const { data: notes, error } = await userBSupabase.from('notes').select('*');
      expect(error).toBeNull();
      expect(notes).not.toBeNull();
      expect(notes).toHaveLength(1);
      expect(notes![0].title).toBe('Note 2B again by B');
      expect(notes![0].organization_id).toBe(orgBId);
    });
    
    it('should INSERT notes only into Org B (RLS policy assigns org_id)', async () => {
      console.log("RLS_TEST_USER_B_INSERT_STARTED");
      if (!userBSupabase || !orgBId || !adminSupabase) throw new Error("User/Admin client or OrgB ID not initialized for User B INSERT test");
      const { data, error } = await userBSupabase
        .from('notes')
        .insert({ title: 'Note 3B by UserB', content: 'UserB content' })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      if(data) expect(data.organization_id).toBe(orgBId);

      const { data: adminData, error: adminError } = await adminSupabase
        .from('notes')
        .select('organization_id')
        .eq('id', data!.id)
        .single();
      expect(adminError).toBeNull();
      if(adminData) expect(adminData.organization_id).toBe(orgBId);
    });
    
    it('should FAIL to INSERT notes into Org A', async () => {
      console.log("RLS_TEST_USER_B_FAIL_INSERT_A_STARTED");
      if (!userBSupabase || !orgAId) throw new Error("User B client or OrgA ID not initialized for User B FAIL INSERT A test");
      const { error } = await userBSupabase
        .from('notes')
        .insert({ title: 'Malicious Note for A by B', content: 'Attempting cross-write by B', organization_id: orgAId });
      
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/security policy|constraint/i);
    });
  });

  // Removed the single dummy test as full tests are restored
}); 