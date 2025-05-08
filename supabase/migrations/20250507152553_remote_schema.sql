CREATE TRIGGER before_user_insert_check_domain BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION check_email_domain();


create policy "Allow authenticated uploads to public folder jrj208_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'team-images'::text) AND ((storage.foldername(name))[1] = 'public'::text)));


create policy "Authenticated asset reads 1bqp9qb_0"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'assets'::text));


create policy "Authenticated asset uploads 1bqp9qb_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'assets'::text));


create policy "Authenticated team image reads jrj208_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'team-images'::text) AND ((storage.foldername(name))[1] = 'public'::text)));



