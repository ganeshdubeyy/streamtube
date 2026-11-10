import { Bookmark, BookmarkCheck, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration, formatPastInfo, formatView } from "../../utils/helper";
import { Link } from "react-router-dom";
import { isVideoSaved, subscribeToLibrary, toggleWatchLater } from "../../utils/videoLibrary";
import AddToPlaylistButton from "../Library/AddToPlaylistButton";

const VideoCard = ({ video }) => {
  const { snippet, statistics } = video;
  const [saved, setSaved] = useState(() => isVideoSaved(video.id));

  useEffect(() => subscribeToLibrary((key) => {
    if (!key || key === "streamtubeWatchLater") setSaved(isVideoSaved(video.id));
  }), [video.id]);

  return (
    <article className="group relative flex flex-col">
      <Link to={`/watch?v=${video.id}`} className="flex flex-col">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1a1a1a]">
          <img
            src={snippet.thumbnails.medium.url}
            alt={snippet.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.contentDetails.duration)}
          </span>
        </div>

        <div className="flex gap-3 mt-3 pr-9">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-black dark:text-white leading-snug line-clamp-2">
              {snippet.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {snippet.channelTitle}
              </p>
              {statistics.viewCount > 100000 && <BadgeCheck size={12} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatView(statistics.viewCount)} • {formatPastInfo(snippet.publishedAt)}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => setSaved(toggleWatchLater(video))}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        aria-label={saved ? "Remove from Watch Later" : "Save to Watch Later"}
        title={saved ? "Saved to Watch Later" : "Save to Watch Later"}
      >
        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </button>
      <AddToPlaylistButton video={video} className="absolute right-2 top-14 z-20" />
    </article>
  );
};

export default VideoCard;
