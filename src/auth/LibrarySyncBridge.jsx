import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../utils/supabaseClient";
import { LIBRARY_EVENT, LIBRARY_STORAGE_KEYS, applyLibrarySnapshot, readLibrarySnapshot } from "../utils/videoLibrary";

const OWNER_KEY = "streamtubeCloudOwner";

const mergeLists = (remote = [], local = [], key = "id") => {
  const merged = new Map();
  [...remote, ...local].forEach((item) => {
    if (item?.[key]) {
      const previous = merged.get(item[key]);
      if (item.videos && previous?.videos) {
        const videos = mergeLists(previous.videos, item.videos);
        merged.set(item[key], { ...item, ...previous, videos });
      } else {
        merged.set(item[key], { ...item, ...previous });
      }
    }
  });
  return [...merged.values()];
};

const mergeSnapshots = (remote = {}, local = {}) => Object.fromEntries(
  LIBRARY_STORAGE_KEYS.map((key) => [key, mergeLists(remote[key] || [], local[key] || [])]),
);

const clearLocalLibrary = () => {
  LIBRARY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("streamtubeNotifications");
  localStorage.removeItem(OWNER_KEY);
  window.dispatchEvent(new CustomEvent(LIBRARY_EVENT, { detail: { key: null, source: "cloud" } }));
};

export default function LibrarySyncBridge() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;
    if (!userId) {
      if (localStorage.getItem(OWNER_KEY)) clearLocalLibrary();
      return undefined;
    }

    let active = true;
    let channel;
    let writeTimer;
    let syncing = false;
    let pendingWrite = false;
    let pendingChannelSync = false;

    const syncYoutubeSubscriptions = async () => {
      const { error } = await supabase.functions.invoke("sync-youtube-subscriptions");
      if (error) console.warn("Could not sync YouTube upload alerts:", error.message);
    };

    const writeCloudSnapshot = async () => {
      if (!active || syncing) {
        pendingWrite = true;
        return;
      }
      syncing = true;
      pendingWrite = false;
      const { error } = await supabase.from("user_library").upsert({
        user_id: userId,
        data: readLibrarySnapshot(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      syncing = false;
      if (!active) return;
      if (error) setSyncMessage(`Cloud save failed: ${error.message}`);
      else setSyncMessage("Your library is synced.");
      if (!error && pendingChannelSync) {
        pendingChannelSync = false;
        await syncYoutubeSubscriptions();
      }
      if (pendingWrite) writeCloudSnapshot();
    };

    const initialize = async () => {
      const previousOwner = localStorage.getItem(OWNER_KEY);
      const guestSnapshot = previousOwner ? {} : readLibrarySnapshot();
      if (previousOwner && previousOwner !== userId) clearLocalLibrary();

      const { data, error } = await supabase
        .from("user_library")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setSyncMessage(`Cloud sync setup needed: ${error.message}`);
        return;
      }

      const merged = mergeSnapshots(data?.data || {}, guestSnapshot);
      applyLibrarySnapshot(merged);
      localStorage.setItem(OWNER_KEY, userId);
      setSyncMessage("Your library is synced.");
      if (!data || Object.values(guestSnapshot).some((items) => items.length)) await writeCloudSnapshot();
      await syncYoutubeSubscriptions();

      channel = supabase
        .channel(`library-${userId}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "user_library",
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          if (!active || payload.eventType === "DELETE") return;
          applyLibrarySnapshot(payload.new.data || {});
          setSyncMessage("Library updated from another device.");
        })
        .subscribe();
    };

    const onLibraryChange = (event) => {
      if (event.detail?.source === "cloud") return;
      if (event.detail?.key === "streamtubeSubscriptions" || !event.detail?.key) pendingChannelSync = true;
      clearTimeout(writeTimer);
      writeTimer = window.setTimeout(writeCloudSnapshot, 350);
    };
    const onStorageChange = (event) => {
      if (event.key === "streamtubeSubscriptions" || event.key === null) pendingChannelSync = true;
      clearTimeout(writeTimer);
      writeTimer = window.setTimeout(writeCloudSnapshot, 350);
    };

    initialize();
    window.addEventListener(LIBRARY_EVENT, onLibraryChange);
    window.addEventListener("storage", onStorageChange);

    return () => {
      active = false;
      clearTimeout(writeTimer);
      window.removeEventListener(LIBRARY_EVENT, onLibraryChange);
      window.removeEventListener("storage", onStorageChange);
      if (channel) supabase.removeChannel(channel);
      if (localStorage.getItem(OWNER_KEY) === userId) clearLocalLibrary();
    };
  }, [userId, authLoading]);

  return syncMessage ? <div className="sr-only" role="status" aria-live="polite">{syncMessage}</div> : null;
}
