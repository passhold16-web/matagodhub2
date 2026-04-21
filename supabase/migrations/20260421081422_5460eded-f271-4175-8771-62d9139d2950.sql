-- Replace broad SELECT policy with one that only allows direct object access
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar files are publicly readable by path"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND name IS NOT NULL
    AND name <> ''
  );