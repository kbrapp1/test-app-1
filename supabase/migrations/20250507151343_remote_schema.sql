

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_email_domain"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
        DECLARE
      -- !!! CUSTOMIZE THIS LIST !!!
      allowed_domains TEXT[] := ARRAY['vistaonemarketing.com', 'ironmarkusa.com'];
          email_domain TEXT;
        BEGIN
          email_domain := split_part(NEW.email, '@', 2);
          IF NOT (email_domain = ANY(allowed_domains)) THEN
            RAISE EXCEPTION 'Email domain % is not allowed. Please use a valid company email.', email_domain;
          END IF;
          RETURN NEW;
        END;
        $$;


ALTER FUNCTION "public"."check_email_domain"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_get_all_jwt_claims"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$$;


ALTER FUNCTION "public"."debug_get_all_jwt_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT nullif( (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', '')::uuid;
$$;


ALTER FUNCTION "public"."get_active_organization_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_organization_id"() IS 'Retrieves the active organization ID from the JWT claims for RLS checks.';



CREATE OR REPLACE FUNCTION "public"."get_current_auth_uid_for_test"() RETURNS "uuid"
    LANGUAGE "sql"
    SET "search_path" TO 'auth', 'pg_temp'
    AS $$
  SELECT auth.uid();
$$;


ALTER FUNCTION "public"."get_current_auth_uid_for_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_folder_path"("p_folder_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "depth" integer)
    LANGUAGE "sql" STABLE
    AS $$
  WITH RECURSIVE folder_hierarchy AS (
    -- Base case: the starting folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      0 AS depth -- Start depth at 0
    FROM public.folders f
    WHERE f.id = p_folder_id

    UNION ALL

    -- Recursive step: find the parent of the current folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      fh.depth + 1 -- Increment depth
    FROM public.folders f
    JOIN folder_hierarchy fh ON f.id = fh.parent_folder_id
    WHERE fh.parent_folder_id IS NOT NULL -- Stop when we reach the root (parent is null)
  )
  -- Select the path, ordering by depth descending to get Root -> ... -> Current
  SELECT 
    fh.id, 
    fh.name,
    fh.depth
  FROM folder_hierarchy fh
  ORDER BY fh.depth DESC;
$$;


ALTER FUNCTION "public"."get_folder_path"("p_folder_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin_of_organization"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()::uuid -- Explicitly cast auth.uid() to uuid
      AND om.role = 'admin'::text
  );
$$;


ALTER FUNCTION "public"."is_user_admin_of_organization"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = user_id_to_check
      AND om.organization_id = organization_id_to_check
  );
$$;


ALTER FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") IS 'Checks if a given user is a member of a given organization. SECURITY DEFINER to be used in RLS policies safely.';



CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."TtsPrediction" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "replicatePredictionId" "text" NOT NULL,
    "status" "text" NOT NULL,
    "inputText" "text" NOT NULL,
    "outputUrl" "text",
    "createdAt" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "userId" "uuid" NOT NULL,
    "sourceAssetId" "uuid",
    "outputAssetId" "uuid",
    "voiceId" "text",
    "errorMessage" "text",
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."TtsPrediction" OWNER TO "postgres";


COMMENT ON COLUMN "public"."TtsPrediction"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."asset_tags" (
    "asset_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."asset_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "size" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "folder_id" "uuid",
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."assets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assets"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_folder_id" "uuid",
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."folders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."folders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."folders"."parent_folder_id" IS 'References the parent folder''s ID for hierarchical structure. NULL for top-level folders.';



COMMENT ON COLUMN "public"."folders"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text",
    "position" integer,
    "color_class" "text" DEFAULT 'bg-yellow-200'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notes"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."organization_domains" (
    "organization_id" "uuid" NOT NULL,
    "domain_name" "text" NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_domains" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_domains" IS 'Stores email domains associated with organizations for verification and auto-assignment.';



COMMENT ON COLUMN "public"."organization_domains"."organization_id" IS 'FK to the organization that owns this domain.';



COMMENT ON COLUMN "public"."organization_domains"."domain_name" IS 'The email domain (e.g., acme.com).';



COMMENT ON COLUMN "public"."organization_domains"."verified_at" IS 'Timestamp when the organization proved ownership of this domain.';



COMMENT ON COLUMN "public"."organization_domains"."created_at" IS 'Timestamp of when the domain association was created.';



CREATE TABLE IF NOT EXISTS "public"."organization_memberships" (
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organization_memberships_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'editor'::"text", 'viewer'::"text"])))
);

ALTER TABLE ONLY "public"."organization_memberships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_memberships" IS 'Join table linking users to organizations and defining their role within that organization.';



COMMENT ON COLUMN "public"."organization_memberships"."user_id" IS 'FK to the user.';



COMMENT ON COLUMN "public"."organization_memberships"."organization_id" IS 'FK to the organization.';



COMMENT ON COLUMN "public"."organization_memberships"."role" IS 'Role of the user within this specific organization (e.g., admin, member, editor, viewer).';



COMMENT ON COLUMN "public"."organization_memberships"."created_at" IS 'Timestamp of when the membership was created.';



COMMENT ON COLUMN "public"."organization_memberships"."updated_at" IS 'Timestamp of when the membership was last updated.';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_user_id" "uuid",
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."organizations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'Stores organization (tenant) information.';



COMMENT ON COLUMN "public"."organizations"."id" IS 'Unique identifier for the organization.';



COMMENT ON COLUMN "public"."organizations"."name" IS 'Display name of the organization.';



COMMENT ON COLUMN "public"."organizations"."owner_user_id" IS 'The user who initially created or owns the organization.';



COMMENT ON COLUMN "public"."organizations"."slug" IS 'URL-friendly unique slug for the organization (for routing, optional).';



COMMENT ON COLUMN "public"."organizations"."created_at" IS 'Timestamp of when the organization was created.';



COMMENT ON COLUMN "public"."organizations"."updated_at" IS 'Timestamp of when the organization was last updated.';



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tags"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "primary_image_path" "text" NOT NULL,
    "secondary_image_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."team_members"."organization_id" IS 'FK to the organization this record belongs to.';



CREATE TABLE IF NOT EXISTS "public"."team_user_memberships" (
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_in_team" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "team_user_memberships_role_in_team_check" CHECK (("role_in_team" = ANY (ARRAY['leader'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."team_user_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_user_memberships" IS 'Join table linking users to functional teams within an organization.';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Stores functional team information, nested within organizations.';



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_replicatePredictionId_key" UNIQUE ("replicatePredictionId");



ALTER TABLE ONLY "public"."asset_tags"
    ADD CONSTRAINT "asset_tags_pkey" PRIMARY KEY ("asset_id", "tag_id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_org_folder_name_unique" UNIQUE ("organization_id", "folder_id", "name");



COMMENT ON CONSTRAINT "assets_org_folder_name_unique" ON "public"."assets" IS 'Ensures asset names are unique within a folder in an organization.';



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_org_parent_name_unique" UNIQUE ("organization_id", "parent_folder_id", "name");



COMMENT ON CONSTRAINT "folders_org_parent_name_unique" ON "public"."folders" IS 'Ensures folder names are unique within a parent folder in an organization.';



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_domains"
    ADD CONSTRAINT "organization_domains_domain_name_key" UNIQUE ("domain_name");



ALTER TABLE ONLY "public"."organization_domains"
    ADD CONSTRAINT "organization_domains_pkey" PRIMARY KEY ("organization_id", "domain_name");



ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_org_name_unique" UNIQUE ("organization_id", "name");



COMMENT ON CONSTRAINT "tags_org_name_unique" ON "public"."tags" IS 'Ensures tag names are unique within an organization.';



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_user_memberships"
    ADD CONSTRAINT "team_user_memberships_pkey" PRIMARY KEY ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_org_name_unique" UNIQUE ("organization_id", "name");



COMMENT ON CONSTRAINT "teams_org_name_unique" ON "public"."teams" IS 'Ensures team names are unique within an organization.';



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "assets_folder_id_idx" ON "public"."assets" USING "btree" ("folder_id");



CREATE INDEX "idx_assets_folder_id" ON "public"."assets" USING "btree" ("folder_id");



CREATE INDEX "idx_folders_parent_folder_id" ON "public"."folders" USING "btree" ("parent_folder_id");



CREATE OR REPLACE TRIGGER "handle_organization_memberships_updated_at" BEFORE UPDATE ON "public"."organization_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_timestamp_tts_prediction" BEFORE UPDATE ON "public"."TtsPrediction" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_outputAssetId_fkey" FOREIGN KEY ("outputAssetId") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TtsPrediction"
    ADD CONSTRAINT "TtsPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_tags"
    ADD CONSTRAINT "asset_tags_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_tags"
    ADD CONSTRAINT "asset_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "fk_folders_parent_folder" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_domains"
    ADD CONSTRAINT "organization_domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_user_memberships"
    ADD CONSTRAINT "team_user_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_user_memberships"
    ADD CONSTRAINT "team_user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage memberships of organizations they administer" ON "public"."organization_memberships" TO "authenticated" USING ("public"."is_user_admin_of_organization"("organization_id")) WITH CHECK ("public"."is_user_admin_of_organization"("organization_id"));



CREATE POLICY "Admins can update their own organization details" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ("public"."is_user_admin_of_organization"("id")) WITH CHECK ("public"."is_user_admin_of_organization"("id"));



CREATE POLICY "Admins can view all memberships of organizations they administe" ON "public"."organization_memberships" FOR SELECT TO "authenticated" USING ("public"."is_user_admin_of_organization"("organization_id"));



CREATE POLICY "Asset Tags: Org members can manage tags for their org assets" ON "public"."asset_tags" USING (((EXISTS ( SELECT 1
   FROM ("public"."assets" "a"
     JOIN "public"."organization_memberships" "om" ON (("a"."organization_id" = "om"."organization_id")))
  WHERE (("a"."id" = "asset_tags"."asset_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"))) WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."assets" "a"
     JOIN "public"."organization_memberships" "om" ON (("a"."organization_id" = "om"."organization_id")))
  WHERE (("a"."id" = "asset_tags"."asset_id") AND ("om"."user_id" = "auth"."uid"()) AND ("a"."organization_id" = "public"."get_active_organization_id"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Assets access based on active organization" ON "public"."assets" TO "authenticated" USING (("organization_id" = "public"."get_active_organization_id"())) WITH CHECK (("organization_id" = "public"."get_active_organization_id"()));



CREATE POLICY "Folders access based on active organization" ON "public"."folders" TO "authenticated" USING (("organization_id" = "public"."get_active_organization_id"())) WITH CHECK (("organization_id" = "public"."get_active_organization_id"()));



CREATE POLICY "Members can read domains of their organizations" ON "public"."organization_domains" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "organization_domains"."organization_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Members can view their organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "organizations"."id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "Org admins can manage memberships of teams in their org" ON "public"."team_user_memberships" USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."organization_memberships" "om" ON (("t"."organization_id" = "om"."organization_id")))
  WHERE (("t"."id" = "team_user_memberships"."team_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."organization_memberships" "om" ON (("t"."organization_id" = "om"."organization_id")))
  WHERE (("t"."id" = "team_user_memberships"."team_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = 'admin'::"text")))));



CREATE POLICY "Org members can interact with teams in their org" ON "public"."teams" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "teams"."organization_id") AND ("om"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "teams"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))));



CREATE POLICY "Organization members can access their org data in TtsPrediction" ON "public"."TtsPrediction" USING (((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "TtsPrediction"."organization_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"))) WITH CHECK ((("organization_id" = "public"."get_active_organization_id"()) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Organization members can access their org data in notes" ON "public"."notes" USING (((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "notes"."organization_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"))) WITH CHECK ((("organization_id" = "public"."get_active_organization_id"()) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Organization members can access their org data in tags" ON "public"."tags" USING (((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "tags"."organization_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"))) WITH CHECK ((("organization_id" = "public"."get_active_organization_id"()) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Organization members can access their org data in team_members" ON "public"."team_members" USING (((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "om"
  WHERE (("om"."organization_id" = "team_members"."organization_id") AND ("om"."user_id" = "auth"."uid"())))) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"))) WITH CHECK ((("organization_id" = "public"."get_active_organization_id"()) OR ("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid")));



CREATE POLICY "Superusers can manage organization domains" ON "public"."organization_domains" USING (("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"));



CREATE POLICY "Superusers can manage team user memberships" ON "public"."team_user_memberships" USING (("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"));



CREATE POLICY "Superusers can manage teams" ON "public"."teams" USING (("auth"."uid"() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::"uuid"));



CREATE POLICY "Team members can view their team memberships" ON "public"."team_user_memberships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."organization_memberships" "om" ON (("t"."organization_id" = "om"."organization_id")))
  WHERE (("t"."id" = "team_user_memberships"."team_id") AND ("om"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."TtsPrediction" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own membership entries" ON "public"."organization_memberships" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."asset_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_user_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."check_email_domain"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_domain"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_domain"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_get_all_jwt_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_get_all_jwt_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_get_all_jwt_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_auth_uid_for_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_auth_uid_for_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_auth_uid_for_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_folder_path"("p_folder_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_folder_path"("p_folder_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_folder_path"("p_folder_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_admin_of_organization"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin_of_organization"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin_of_organization"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_member_of_organization"("user_id_to_check" "uuid", "organization_id_to_check" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."moddatetime"() TO "postgres";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";


















GRANT ALL ON TABLE "public"."TtsPrediction" TO "anon";
GRANT ALL ON TABLE "public"."TtsPrediction" TO "authenticated";
GRANT ALL ON TABLE "public"."TtsPrediction" TO "service_role";



GRANT ALL ON TABLE "public"."asset_tags" TO "anon";
GRANT ALL ON TABLE "public"."asset_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_tags" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."folders" TO "anon";
GRANT ALL ON TABLE "public"."folders" TO "authenticated";
GRANT ALL ON TABLE "public"."folders" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."organization_domains" TO "anon";
GRANT ALL ON TABLE "public"."organization_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_domains" TO "service_role";



GRANT ALL ON TABLE "public"."organization_memberships" TO "anon";
GRANT ALL ON TABLE "public"."organization_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."team_user_memberships" TO "anon";
GRANT ALL ON TABLE "public"."team_user_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."team_user_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
