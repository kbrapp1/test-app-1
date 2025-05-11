-- Create function to handle organization membership creation on user confirmation
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invited_org_id TEXT;
  assigned_role_id TEXT;
BEGIN
  -- Get the org ID and role ID from user metadata
  invited_org_id := NEW.raw_user_meta_data->>'invited_to_org';
  assigned_role_id := NEW.raw_user_meta_data->>'assigned_role_id';
  
  -- Only proceed if this was an invite registration
  IF invited_org_id IS NOT NULL AND assigned_role_id IS NOT NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Create the organization membership (if it doesn't exist already)
    INSERT INTO public.organization_memberships (user_id, organization_id, role_id)
    VALUES (NEW.id, invited_org_id, assigned_role_id)
    ON CONFLICT (user_id, organization_id) 
    DO NOTHING; -- Skip if already exists to avoid errors
    
    -- Set the active organization for the new user if it's not already set
    IF (NEW.raw_app_meta_data->>'active_organization_id') IS NULL THEN
      -- Update user's app metadata with the active organization
      UPDATE auth.users 
      SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('active_organization_id', invited_org_id)
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run the function when email is confirmed
CREATE OR REPLACE TRIGGER on_invitation_acceptance
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_invitation_acceptance(); 