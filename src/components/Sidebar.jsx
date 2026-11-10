import {
  Home, Compass, PlaySquare, History, ListVideo, Clock, ThumbsUp,
  Film, Gamepad2, Newspaper, Trophy, Lightbulb, Shirt, Music2, Radio,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { closeMobileSidebar } from "../utils/appSlice";
import { getSubscribedChannels, subscribeToLibrary } from "../utils/videoLibrary";

function SidebarContent({ subscriptions, onNavigate }) {
  const nav = { onClick: onNavigate };
  return (
    <>
      <Link to="/" {...nav} className="flex w-full items-center gap-5 rounded-lg bg-gray-100 px-3 py-2.5 text-black dark:bg-[#272727] dark:text-white">
        <Home size={20} /><span className="text-sm">Home</span>
      </Link>
      <Link to="/shorts" {...nav} className="mt-1 flex w-full items-center gap-5 rounded-lg px-3 py-2.5 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10">
        <Compass size={20} /><span className="text-sm">Shorts</span>
      </Link>
      <Link to="/subscriptions" {...nav} className="mt-1 flex w-full items-center gap-5 rounded-lg px-3 py-2.5 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10">
        <PlaySquare size={20} /><span className="text-sm">Subscriptions</span>
      </Link>

      <hr className="my-3 border-gray-200 dark:border-[#272727]" />
      <div className="mb-1 flex items-center gap-1 px-3">
        <span className="text-sm font-medium text-black dark:text-white">You</span><ChevronRight size={16} className="text-black dark:text-white" />
      </div>
      <Link to="/history" {...nav} className="sidebar-item"><History size={20} /><span>History</span></Link>
      <Link to="/playlists" {...nav} className="sidebar-item"><ListVideo size={20} /><span>Playlists</span></Link>
      <Link to="/your-videos" {...nav} className="sidebar-item"><PlaySquare size={20} /><span>Your videos</span></Link>
      <Link to="/watch-later" {...nav} className="sidebar-item"><Clock size={20} /><span>Watch later</span></Link>
      <Link to="/liked-videos" {...nav} className="sidebar-item"><ThumbsUp size={20} /><span>Liked videos</span></Link>

      <hr className="my-3 border-gray-200 dark:border-[#272727]" />
      <p className="px-3 pb-1 text-sm font-medium text-black dark:text-white">Subscriptions</p>
      <div className="py-1">
        {subscriptions.length ? subscriptions.map((channel) => (
          <a
            key={channel.id}
            href={`https://www.youtube.com/channel/${channel.id}`}
            target="_blank"
            rel="noreferrer"
            onClick={onNavigate}
            className="sidebar-item"
            title={`Open ${channel.title} on YouTube`}
          >
            {channel.thumbnail ? <img src={channel.thumbnail} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs text-white">{channel.title?.[0] || "?"}</span>}
            <span className="truncate text-sm">{channel.title}</span>
          </a>
        )) : <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Channels you subscribe to will appear here.</p>}
      </div>

      <hr className="my-3 border-gray-200 dark:border-[#272727]" />
      <p className="mb-1 px-3 text-sm font-medium text-black dark:text-white">Explore</p>
      <Link to="/explore?categoryId=30" {...nav} className="sidebar-item"><Film size={20} /><span>Movies</span></Link>
      <Link to="/explore?categoryId=20" {...nav} className="sidebar-item"><Gamepad2 size={20} /><span>Gaming</span></Link>
      <Link to="/explore?categoryId=25" {...nav} className="sidebar-item"><Newspaper size={20} /><span>News</span></Link>
      <Link to="/explore?categoryId=17" {...nav} className="sidebar-item"><Trophy size={20} /><span>Sports</span></Link>
      <Link to="/explore?categoryId=27" {...nav} className="sidebar-item"><Lightbulb size={20} /><span>Learning</span></Link>
      <Link to="/explore?categoryId=26" {...nav} className="sidebar-item"><Shirt size={20} /><span>Fashion &amp; Beauty</span></Link>
      <Link to="/explore?categoryId=10" {...nav} className="sidebar-item"><Music2 size={20} /><span>Music</span></Link>
      <Link to="/results?search_query=live%20streams" {...nav} className="sidebar-item"><Radio size={20} /><span>Live</span></Link>

      <hr className="my-3 border-gray-200 dark:border-[#272727]" />
      <div className="px-3 py-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
        <p className="font-bold">About  Press  Copyright </p>
        <p className="font-bold">Contact us  Creators</p>
        <p className="font-bold">Advertise  Developers</p>
        <p className="mt-2 font-bold" >Terms  Privacy Policy &amp; Safety</p>
        <p className="font-bold">How YouTube works</p>
        <p className="mt-2 font-bold">Test new features</p>
        <p className="mt-4 font-bold">© 2026 Google LLC</p>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { isOpen, isMobileOpen } = useSelector((store) => store.app);
  const dispatch = useDispatch();
  const [subscriptions, setSubscriptions] = useState(getSubscribedChannels);

  useEffect(() => {
    const refresh = (key) => {
      if (!key || key === "streamtubeSubscriptions") setSubscriptions(getSubscribedChannels());
    };
    return subscribeToLibrary(refresh);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") dispatch(closeMobileSidebar());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen, dispatch]);

  const closeMobile = () => dispatch(closeMobileSidebar());
  return (
    <>
      {isOpen && (
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-60 shrink-0 overflow-y-auto bg-white px-3 py-3 dark:bg-[#0f0f0f] md:block">
          <SidebarContent subscriptions={subscriptions} />
        </aside>
      )}
      {isMobileOpen && (
        <>
          <button type="button" aria-label="Close navigation" onClick={closeMobile} className="fixed inset-x-0 bottom-0 top-14 z-[60] bg-black/50 md:hidden" />
          <aside className="fixed bottom-0 left-0 top-14 z-[70] w-[min(18rem,85vw)] overflow-y-auto bg-white px-3 py-3 shadow-xl dark:bg-[#0f0f0f] md:hidden">
            <SidebarContent subscriptions={subscriptions} onNavigate={closeMobile} />
          </aside>
        </>
      )}
    </>
  );
}
