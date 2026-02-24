-- Ensure storage schema exists
create schema if not exists storage;

-- Create the bucket safely
insert into storage.buckets (id, name, public)
values ('tryon-local', 'tryon-local', false)
on conflict (id) do nothing;

-- Policies
-- We wrap in DO block to avoid errors if policies already exist or conflict
do $$
begin
    -- Public Access Policy
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'storage' 
        and tablename = 'objects' 
        and policyname = 'Public Access tryon-local'
    ) then
        create policy "Public Access tryon-local"
        on storage.objects for select
        using ( bucket_id = 'tryon-local' );
    end if;

    -- Authenticated Upload Policy
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'storage' 
        and tablename = 'objects' 
        and policyname = 'Authenticated Upload tryon-local'
    ) then
        create policy "Authenticated Upload tryon-local"
        on storage.objects for insert
        with check ( bucket_id = 'tryon-local' );
    end if;
end $$;
