import { supabase } from "@/integrations/supabase/client";

/** Returns true if the user is banned (blocks login / session). */
export async function isUserBanned(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_banned", { _user_id: userId });
  if (error) {
    console.error("Error checking ban status:", error.message);
    return false;
  }
  return data === true;
}

export async function signOutIfBanned(
  userId: string,
  showMessage = false
): Promise<boolean> {
  if (!(await isUserBanned(userId))) return false;
  await supabase.auth.signOut();
  if (showMessage) {
    const { toast } = await import("sonner");
    toast.error("Tu cuenta está suspendida. Contacta con un moderador.");
  }
  return true;
}
