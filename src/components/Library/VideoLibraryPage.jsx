import { useEffect, useState } from "react";
import { Clock3, Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getLibraryVideos,
  removeLibraryVideo,
  subscribeToLibrary,
} from "../../utils/videoLibrary";
import { formatPastInfo, formatView } from "../../utils/helper";
import { useAuth } from "../../auth/useAuth";

const libraries = {
  watchLater: {
    key: "streamtubeWatchLater",
    title: "Watch later",
    empty: "Videos you save will appear here.",
    timeLabel: (video) =>
      video.savedAt ? `Saved ${formatPastInfo(new Date(video.savedAt))}` : "",
  },
  history: {
    key: "streamtubeHistory",
    title: "Watch history",
    empty: "Videos you watch will appear here.",
    timeLabel: (video) =>
      video.watchedAt ? `Watched ${formatPastInfo(new Date(video.watchedAt))}` : "",
  },
  likedVideos: {
    key: "streamtubeLikedVideos",
    title: "Liked videos",
    empty: "Videos you like will appear here.",
    icon: Heart,
    timeLabel: (video) =>
      video.likedAt ? `Liked ${formatPastInfo(new Date(video.likedAt))}` : "",
  },
};

export default function VideoLibraryPage({ type }) {
  const { user } = useAuth();
  const library = libraries[type];
  const LibraryIcon = library.icon || Clock3;
  const [videos, setVideos] = useState(() => getLibraryVideos(library.key));

  useEffect(() => {
    // The router reuses this component when switching between library routes.
    // Load the newly selected list immediately, then keep it in sync with edits.
    setVideos(getLibraryVideos(library.key));
    const refresh = (changedKey) => {
      if (!changedKey || changedKey === library.key) {
        setVideos(getLibraryVideos(library.key));
      }
    };
    return subscribeToLibrary(refresh);
  }, [library.key]);

  return (
    <section className="min-h-screen bg-white px-4 py-6 dark:bg-[#0f0f0f] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <LibraryIcon className="text-gray-500 dark:text-gray-400" />
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {library.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {videos.length} {videos.length === 1 ? "video" : "videos"} · {user ? "Synced with your account" : "Stored on this device"}
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
            <p className="text-gray-600 dark:text-gray-300">{library.empty}</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              {!user && <Link to="/account" className="block text-sm text-blue-600 hover:underline dark:text-blue-400">Sign in to sync your library across devices</Link>}
              <Link to="/" className="block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Explore videos
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-[#303030]">
            {videos.map((video) => (
              <article key={video.id} className="flex gap-4 py-4">
                <Link to={`/watch?v=${video.id}`} className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:w-64">
                  <img
                    src={video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url}
                    alt={video.snippet.title}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/watch?v=${video.id}`} className="line-clamp-2 font-medium text-black hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                    {video.snippet.title}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{video.snippet.channelTitle}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {video.statistics.viewCount ? `${formatView(video.statistics.viewCount)} views · ` : ""}
                    {library.timeLabel(video)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeLibraryVideo(library.key, video.id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#272727]"
                    aria-label={`Remove ${video.snippet.title}`}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
