-- Rename remaining demo crew emails from @buildflowdemo.com to @banksman.app
-- User IDs and passwords stay the same. Only the email domain changes.

UPDATE auth.users
SET email = REPLACE(email, '@buildflowdemo.com', '@banksman.app'),
    updated_at = now()
WHERE email LIKE '%@buildflowdemo.com';

UPDATE auth.identities
SET identity_data = jsonb_set(
      identity_data,
      '{email}',
      to_jsonb(REPLACE(
        identity_data->>'email',
        '@buildflowdemo.com',
        '@banksman.app'
      ))
    )
WHERE identity_data->>'email' LIKE '%@buildflowdemo.com';

UPDATE profiles
SET email = REPLACE(email, '@buildflowdemo.com', '@banksman.app'),
    updated_at = now()
WHERE email LIKE '%@buildflowdemo.com';
