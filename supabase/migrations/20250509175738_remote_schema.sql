alter table "public"."assets" drop constraint "assets_org_folder_name_unique";

alter table "public"."folders" drop constraint "folders_org_parent_name_unique";

alter table "public"."assets" drop constraint "assets_folder_id_fkey";

alter table "public"."folders" drop constraint "fk_folders_parent_folder";

drop index if exists "public"."assets_org_folder_name_unique";

drop index if exists "public"."folders_org_parent_name_unique";

drop index if exists "public"."idx_folders_unique_root_name";

alter table "public"."assets" add constraint "assets_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE not valid;

alter table "public"."assets" validate constraint "assets_folder_id_fkey";

alter table "public"."folders" add constraint "fk_folders_parent_folder" FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE not valid;

alter table "public"."folders" validate constraint "fk_folders_parent_folder";


