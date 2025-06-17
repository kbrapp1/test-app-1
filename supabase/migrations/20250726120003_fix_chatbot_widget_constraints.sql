alter table "public"."chat_leads" drop constraint "chat_leads_follow_up_status_check";

alter table "public"."chat_leads" drop constraint "chat_leads_qualification_status_check";

alter table "public"."chat_messages" drop constraint "chat_messages_message_type_check";

alter table "public"."chat_sessions" drop constraint "chat_sessions_status_check";

alter table "public"."image_generations" drop constraint "check_image_generations_status";

alter table "public"."lead_notes" drop constraint "lead_notes_note_type_check";

alter table "public"."chat_leads" add constraint "chat_leads_follow_up_status_check" CHECK (((follow_up_status)::text = ANY (ARRAY[('new'::character varying)::text, ('contacted'::character varying)::text, ('in_progress'::character varying)::text, ('converted'::character varying)::text, ('lost'::character varying)::text, ('nurturing'::character varying)::text]))) not valid;

alter table "public"."chat_leads" validate constraint "chat_leads_follow_up_status_check";

alter table "public"."chat_leads" add constraint "chat_leads_qualification_status_check" CHECK (((qualification_status)::text = ANY (ARRAY[('not_qualified'::character varying)::text, ('qualified'::character varying)::text, ('highly_qualified'::character varying)::text, ('disqualified'::character varying)::text]))) not valid;

alter table "public"."chat_leads" validate constraint "chat_leads_qualification_status_check";

alter table "public"."chat_messages" add constraint "chat_messages_message_type_check" CHECK (((message_type)::text = ANY (ARRAY[('user'::character varying)::text, ('bot'::character varying)::text, ('system'::character varying)::text, ('lead_capture'::character varying)::text, ('qualification'::character varying)::text]))) not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_message_type_check";

alter table "public"."chat_sessions" add constraint "chat_sessions_status_check" CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('completed'::character varying)::text, ('abandoned'::character varying)::text, ('escalated'::character varying)::text]))) not valid;

alter table "public"."chat_sessions" validate constraint "chat_sessions_status_check";

alter table "public"."image_generations" add constraint "check_image_generations_status" CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text]))) not valid;

alter table "public"."image_generations" validate constraint "check_image_generations_status";

alter table "public"."lead_notes" add constraint "lead_notes_note_type_check" CHECK (((note_type)::text = ANY (ARRAY[('general'::character varying)::text, ('call'::character varying)::text, ('email'::character varying)::text, ('meeting'::character varying)::text, ('proposal'::character varying)::text, ('follow_up'::character varying)::text]))) not valid;

alter table "public"."lead_notes" validate constraint "lead_notes_note_type_check";


