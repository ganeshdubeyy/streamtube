import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { supabase } from "../../utils/supabaseClient";

export default function AccountPage() {
  const { user, profile, loading, profileError, passwordRecovery, completePasswordRecovery, updateProfile, signOut } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const userId = user?.id;
  const userDisplayName = user?.user_metadata?.display_name || "";
  const resetFlow = passwordRecovery;

  useEffect(() => {
    if (!userId) return;
    setDisplayName(profile?.display_name || userDisplayName);
    setAvatarUrl(profile?.avatar_url || "");
  }, [userId, userDisplayName, profile?.display_name, profile?.avatar_url]);

  useEffect(() => {
    if (resetFlow) {
      setMode("reset");
      setError("");
      setMessage("Choose a new password for your account.");
    }
  }, [resetFlow]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (authError) throw authError;
        setMessage(data.session ? "Your account is ready." : "Check your email to confirm your account, then come back and log in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setMessage("You’re signed in. Your library is loading.");
      }
      setPassword("");
    } catch (authError) {
      setError(authError.message || "Could not complete that account action.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const { error: saveError } = await updateProfile({ displayName, avatarUrl });
    setBusy(false);
    if (saveError) setError(saveError.message);
    else setMessage("Profile saved.");
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/account`,
      });
      if (resetError) throw resetError;
      setMessage("If an account uses that email, Supabase will send a password reset link. Check your inbox and spam folder.");
    } catch (resetError) {
      setError(resetError.message || "Could not send the password reset email.");
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      completePasswordRecovery();
      window.history.replaceState({}, document.title, "/account");
      await signOut();
      setPassword("");
      setConfirmPassword("");
      setMode("login");
      setMessage("Password changed. Log in with your new password.");
    } catch (updateError) {
      setError(updateError.message || "Could not update the password. Open a fresh reset link and try again.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setError("");
    const { error: logoutError } = await signOut();
    if (logoutError) setError(logoutError.message);
    else setMessage("You’re signed out. Your account library was removed from this browser.");
  };

  if (loading) return <main className="grid min-h-[60vh] place-items-center text-gray-500">Checking your account…</main>;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-white px-4 py-10 dark:bg-[#0f0f0f]">
      <section className="mx-auto max-w-lg rounded-2xl border border-gray-200 p-6 text-black dark:border-[#303030] dark:text-white sm:p-8">
        {resetFlow ? (
          <>
            <h1 className="text-2xl font-semibold">Choose a new password</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter and confirm a new password for your account.</p>
            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <label className="block text-sm">New password
                <input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>
              <label className="block text-sm">Confirm new password
                <input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>
              <button disabled={busy} className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">{busy ? "Updating…" : "Update password"}</button>
            </form>
          </>
        ) : user ? (
          <>
            <h1 className="text-2xl font-semibold">Your account</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Signed in as {user.email}. Your saved library follows this account.</p>
            {profileError && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Profile table setup needed: {profileError}</p>}
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <label className="block text-sm">Display name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>
              <label className="block text-sm">Avatar image URL (optional)
                <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" placeholder="https://…" />
              </label>
              <button disabled={busy} className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">Save profile</button>
              <button type="button" onClick={logout} className="ml-2 rounded-full border border-gray-300 px-5 py-2 text-sm dark:border-[#454545]">Sign out</button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{mode === "login" ? "Sign in to StreamTube" : "Create your account"}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to sync your playlists and saved videos across devices.</p>
            {(mode === "login" || mode === "signup") && <div className="mt-5 flex gap-2 rounded-full bg-gray-100 p-1 dark:bg-[#272727]">
              {["login", "signup"].map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(""); setMessage(""); }} className={`flex-1 rounded-full px-3 py-2 text-sm capitalize ${mode === item ? "bg-white shadow dark:bg-[#444]" : "text-gray-500"}`}>{item === "login" ? "Log in" : "Sign up"}</button>)}
            </div>}
            {mode === "forgot" && <button type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="mt-5 text-sm text-blue-600 hover:underline dark:text-blue-400">← Back to log in</button>}
            {mode === "forgot" ? (
              <form onSubmit={requestPasswordReset} className="mt-5 space-y-4">
                <label className="block text-sm">Email
                  <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
                </label>
                <button disabled={busy} className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">{busy ? "Sending…" : "Send reset link"}</button>
              </form>
            ) : <form onSubmit={submitAuth} className="mt-5 space-y-4">
              {mode === "signup" && <label className="block text-sm">Display name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>}
              <label className="block text-sm">Email
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>
              <label className="block text-sm">Password
                <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-[#454545]" />
              </label>
              {mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="-mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">Forgot password?</button>}
              <button disabled={busy} className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
            </form>}
          </>
        )}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">{message}</p>}
        <Link to="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Back to videos</Link>
      </section>
    </main>
  );
}
