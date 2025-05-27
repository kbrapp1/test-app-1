-- Add missing auth triggers that should have been included in initial migration
-- These triggers are essential for proper user profile creation and management

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for user email updates  
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- Create trigger for user last sign in updates
DROP TRIGGER IF EXISTS on_auth_user_last_sign_in_updated ON auth.users;
CREATE TRIGGER on_auth_user_last_sign_in_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_last_sign_in_update();

-- Create trigger for email domain validation
DROP TRIGGER IF EXISTS before_user_insert_check_domain ON auth.users;
CREATE TRIGGER before_user_insert_check_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_email_domain();