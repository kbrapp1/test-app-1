alter table "public"."image_generations" add column "aspect_ratio" character varying(10) default '1:1'::character varying;

alter table "public"."image_generations" add column "base_image_url" text;

alter table "public"."image_generations" add column "edit_type" character varying(50) default 'text-to-image'::character varying;

alter table "public"."image_generations" add column "estimated_cost_cents" integer;

alter table "public"."image_generations" add column "external_provider_id" character varying(100) default NULL::character varying;

alter table "public"."image_generations" add column "source_dam_asset_id" uuid;

CREATE INDEX idx_image_generations_aspect_ratio ON public.image_generations USING btree (aspect_ratio);

CREATE INDEX idx_image_generations_edit_type ON public.image_generations USING btree (edit_type);

CREATE INDEX idx_image_generations_external_provider_id ON public.image_generations USING btree (external_provider_id) WHERE (external_provider_id IS NOT NULL);

CREATE INDEX idx_image_generations_provider_model ON public.image_generations USING btree (provider_name, model_name);

CREATE INDEX idx_image_generations_source_dam ON public.image_generations USING btree (source_dam_asset_id) WHERE (source_dam_asset_id IS NOT NULL);

alter table "public"."image_generations" add constraint "check_image_generations_aspect_ratio_valid" CHECK (((aspect_ratio)::text = ANY ((ARRAY['1:1'::character varying, '16:9'::character varying, '9:16'::character varying, '4:3'::character varying, '3:4'::character varying, '21:9'::character varying, '9:21'::character varying, '3:7'::character varying, '7:3'::character varying, 'custom'::character varying])::text[]))) not valid;

alter table "public"."image_generations" validate constraint "check_image_generations_aspect_ratio_valid";

alter table "public"."image_generations" add constraint "check_image_generations_edit_type_valid" CHECK (((edit_type)::text = ANY ((ARRAY['text-to-image'::character varying, 'image-editing'::character varying, 'style-transfer'::character varying, 'background-swap'::character varying])::text[]))) not valid;

alter table "public"."image_generations" validate constraint "check_image_generations_edit_type_valid";

alter table "public"."image_generations" add constraint "check_image_generations_estimated_cost_positive" CHECK (((estimated_cost_cents IS NULL) OR (estimated_cost_cents >= 0))) not valid;

alter table "public"."image_generations" validate constraint "check_image_generations_estimated_cost_positive";


