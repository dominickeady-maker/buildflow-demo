-- Rename demo account emails from buildflowdemo.com to banksman.app
-- User IDs and all linked data stay the same. Passwords unchanged.
-- Only touches the two demo accounts.

-- 1. auth.users
UPDATE auth.users
SET email = 'manager@banksman.app',
    updated_at = now()
WHERE id = '923b1109-85c9-402f-a443-3c88588a60ec';

UPDATE auth.users
SET email = 'worker@banksman.app',
    updated_at = now()
WHERE id = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2';

-- 2. auth.identities — update identity_data JSONB
UPDATE auth.identities
SET identity_data = jsonb_set(
      identity_data,
      '{email}',
      to_jsonb('manager@banksman.app'::text)
    )
WHERE user_id = '923b1109-85c9-402f-a443-3c88588a60ec';

UPDATE auth.identities
SET identity_data = jsonb_set(
      identity_data,
      '{email}',
      to_jsonb('worker@banksman.app'::text)
    )
WHERE user_id = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2';

-- 3. public.profiles email column
UPDATE profiles
SET email = 'manager@banksman.app',
    updated_at = now()
WHERE id = '923b1109-85c9-402f-a443-3c88588a60ec';

UPDATE profiles
SET email = 'worker@banksman.app',
    updated_at = now()
WHERE id = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2';
