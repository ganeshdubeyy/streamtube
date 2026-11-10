import { useEffect, useState } from "react";
import { ListPlus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  addVideoToPlaylist,
  getPlaylists,
  subscribeToLibrary,
} from "../../utils/videoLibrary";

export default function AddToPlaylistButton({ video, className = "" }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState(getPlaylists);
  const [message, setMessage] = useState("");

  useEffect(() => subscribeToLibrary((key) => {
    if (!key || key === "streamtubePlaylists") setPlaylists(getPlaylists());
  }), []);

  const addToPlaylist = (playlist) => {
    const added = addVideoToPlaylist(playlist.id, video);
    setMessage(added ? `Added to ${playlist.name}` : "Already in this playlist");
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen((current) => !current); setMessage(""); }}
        className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        aria-label="Add to playlist"
        aria-expanded={open}
        title="Add to playlist"
      >
        <ListPlus size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-gray-200 bg-white p-2 text-black shadow-xl dark:border-[#3f3f3f] dark:bg-[#212121] dark:text-white">
          <p className="px-2 py-1 text-sm font-semibold">Save to playlist</p>
          {playlists.length ? playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              onClick={() => addToPlaylist(playlist)}
              className="block w-full truncate rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#3f3f3f]"
            >
              {playlist.name}
            </button>
          )) : (
            <p className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">Create a playlist to save this video.</p>
          )}
          <Link
            to="/playlists"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-2 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-[#3f3f3f]"
          >
            Manage playlists
          </Link>
        </div>
      )}
      {message && <span role="status" className="sr-only">{message}</span>}
    </div>
  );
}
