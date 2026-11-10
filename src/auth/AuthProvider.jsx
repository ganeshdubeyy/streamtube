import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Could not restore Supabase session:", error.message);
      setSession(data?.session || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setProfileError("");
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;
  const userDisplayName = session?.user?.user_metadata?.display_name || "";
  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfile(null);
      return () => { active = false; };
    }

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, updated_at")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setProfileError(error.message);
        setProfile({
          id: userId,
          display_name: userDisplayName,
          avatar_url: "",
        });
        return;
      }
      setProfile(data || {
        id: userId,
        display_name: userDisplayName,
        avatar_url: "",
      });
    };
    loadProfile();
    return () => { active = false; };
  }, [userId, userDisplayName]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    profileError,
    passwordRecovery,
    completePasswordRecovery() {
      setPasswordRecovery(false);
    },
    async updateProfile({ displayName, avatarUrl }) {
      if (!session?.user) return { error: new Error("Sign in before editing your profile.") };
      const updates = {
        id: session.user.id,
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "id" })
        .select("id, display_name, avatar_url, updated_at")
        .single();
      if (!error) setProfile(data);
      return { error };
    },
    async signOut() {
      return supabase.auth.signOut();
    },
  }), [session, profile, loading, profileError, passwordRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
