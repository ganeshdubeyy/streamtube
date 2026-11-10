import { useEffect, useState } from "react";
import { ListVideo, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylists,
  renamePlaylist,
  removeVideoFromPlaylist,
  subscribeToLibrary,
} from "../../utils/videoLibrary";
import { useAuth } from "../../auth/useAuth";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState(getPlaylists);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const selected = playlists.find((playlist) => playlist.id === playlistId);

  useEffect(() => {
    setEditName(selected?.name || "");
  }, [selected?.id, selected?.name]);

  useEffect(() => subscribeToLibrary((key) => {
    if (!key || key === "streamtubePlaylists") setPlaylists(getPlaylists());
  }), []);

  const handleCreate = (event) => {
    event.preventDefault();
    const playlist = createPlaylist(name);
    if (!playlist) {
      setError(name.trim() ? "A playlist with that name already exists." : "Enter a playlist name.");
      return;
    }
    setName("");
    setError("");
    navigate(`/playlists/${playlist.id}`);
  };

  const handleDelete = (id) => {
    deletePlaylist(id);
    if (id === playlistId) navigate("/playlists");
  };

  const handleRename = (event) => {
    event.preventDefault();
    if (!renamePlaylist(playlistId, editName)) {
      setError(editName.trim() ? "A playlist with that name already exists." : "Enter a playlist name.");
      return;
    }
    setError("");
  };

  return (
    <section className="min-h-screen bg-white px-4 py-6 dark:bg-[#0f0f0f] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <ListVideo className="text-gray-500 dark:text-gray-400" />
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {selected?.name || "Your playlists"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user ? "Playlists sync with your account." : "Playlists are stored on this device."}</p>
          </div>
        </div>

        {playlistId && (
          <Link to="/playlists" className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">← All playlists</Link>
        )}

        {selected && (
          <form onSubmit={handleRename} className="mb-4 flex max-w-xl gap-2">
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={60}
              aria-label="Rename playlist"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-black outline-none focus:border-blue-500 dark:border-[#3f3f3f] dark:text-white"
            />
            <button type="submit" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-[#3f3f3f] dark:text-white dark:hover:bg-[#272727]">Rename</button>
            {error && <p role="alert" className="self-center text-sm text-red-600">{error}</p>}
          </form>
        )}

        {!playlistId && (
          <form onSubmit={handleCreate} className="mb-6 flex max-w-xl flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="New playlist name"
              aria-label="New playlist name"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-black outline-none focus:border-blue-500 dark:border-[#3f3f3f] dark:text-white"
            />
            <button type="submit" className="rounded-lg bg-black px-5 py-2 font-medium text-white hover:opacity-80 dark:bg-white dark:text-black">Create playlist</button>
            {error && <p role="alert" className="text-sm text-red-600 sm:basis-full">{error}</p>}
          </form>
        )}

        {playlistId ? (
          selected ? (
            selected.videos.length ? (
              <div className="divide-y divide-gray-200 dark:divide-[#303030]">
                {selected.videos.map((video) => (
                  <article key={video.id} className="flex gap-4 py-4">
                    <Link to={`/watch?v=${video.id}`} className="aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:w-64">
                      <img src={video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url} alt={video.snippet.title} className="h-full w-full object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/watch?v=${video.id}`} className="line-clamp-2 font-medium text-black hover:text-blue-600 dark:text-white dark:hover:text-blue-400">{video.snippet.title}</Link>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{video.snippet.channelTitle}</p>
                      <button type="button" onClick={() => removeVideoFromPlaylist(selected.id, video.id)} className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#272727]">
                        <Trash2 size={16} /> Remove from playlist
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
                <p className="text-gray-600 dark:text-gray-300">This playlist is empty. Add videos using the playlist button on a video.</p>
                <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Explore videos</Link>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
              <p className="text-gray-600 dark:text-gray-300">That playlist no longer exists.</p>
              <Link to="/playlists" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Back to playlists</Link>
            </div>
          )
        ) : playlists.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <article key={playlist.id} className="rounded-xl border border-gray-200 p-4 dark:border-[#303030]">
                <Link to={`/playlists/${playlist.id}`} className="block">
                  <h2 className="truncate font-semibold text-black dark:text-white">{playlist.name}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{playlist.videos.length} {playlist.videos.length === 1 ? "video" : "videos"}</p>
                </Link>
                <button type="button" onClick={() => handleDelete(playlist.id)} className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#272727]">
                  <Trash2 size={16} /> Delete playlist
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
            <p className="text-gray-600 dark:text-gray-300">You have no playlists yet. Create one above, then add videos from their cards or watch pages.</p>
          </div>
        )}
      </div>
    </section>
  );
}
