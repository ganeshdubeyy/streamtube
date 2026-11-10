import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { supabase } from "../../utils/supabaseClient";
import { formatPastInfo } from "../../utils/helper";

export default function NotificationMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("app_notifications")
      .select("id, channel_id, channel_title, video_id, video_title, published_at, created_at, is_read")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setError("");
    setNotifications(data || []);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setError("");
      return undefined;
    }
    loadNotifications();
    const channel = supabase
      .channel(`app-notifications-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "app_notifications",
        filter: `user_id=eq.${user.id}`,
      }, loadNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    const closeOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    const { error: updateError } = await supabase.from("app_notifications")
      .update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    if (updateError) loadNotifications();
  };

  const markRead = async (id) => {
    if (!user) return;
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    const { error: updateError } = await supabase.from("app_notifications")
      .update({ is_read: true }).eq("id", id).eq("user_id", user.id);
    if (updateError) loadNotifications();
  };

  const clearAll = async () => {
    if (!user) return;
    setNotifications([]);
    const { error: deleteError } = await supabase.from("app_notifications")
      .delete().eq("user_id", user.id);
    if (deleteError) loadNotifications();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-controls="notification-menu"
      >
        <Bell size={22} className="text-black dark:text-white" strokeWidth={1.8} />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <section id="notification-menu" aria-label="Notifications" className="absolute right-0 top-11 z-[70] w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-gray-200 bg-white text-black shadow-xl dark:border-[#303030] dark:bg-[#212121] dark:text-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#303030]">
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">New uploads from channels you follow</p>
            </div>
            {user && notifications.length > 0 && <div className="flex items-center gap-1">
              {unreadCount > 0 && <button type="button" onClick={markAllRead} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#3f3f3f]" aria-label="Mark all notifications read" title="Mark all read"><CheckCheck size={17} /></button>}
              <button type="button" onClick={clearAll} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#3f3f3f]" aria-label="Clear notifications" title="Clear all"><Trash2 size={16} /></button>
            </div>}
          </div>

          {!user ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sign in and follow channels in StreamTube to receive new upload alerts here.</p>
          ) : error ? (
            <p role="alert" className="px-5 py-8 text-center text-sm text-red-600 dark:text-red-400">Could not load notifications. Check that the Supabase notifications setup has been applied.</p>
          ) : notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No new uploads yet. Follow a channel and new videos will appear here.</p>
          ) : (
            <ul className="max-h-[min(65vh,28rem)] overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={`/watch?v=${encodeURIComponent(notification.video_id)}`}
                    onClick={() => { markRead(notification.id); setOpen(false); }}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#303030] ${notification.is_read ? "" : "bg-blue-50 dark:bg-[#26354a]"}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? "bg-transparent" : "bg-blue-600"}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{notification.video_title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600 dark:text-gray-300">New video from {notification.channel_title}</span>
                      <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">{formatPastInfo(new Date(notification.created_at))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
