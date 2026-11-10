import { Link } from "react-router-dom";
import { formatDuration, formatPastInfo, formatView } from "../../utils/helper";

const SearchResultCard = ({ video }) => {
  const { snippet = {}, statistics = {}, contentDetails = {} } = video;
  const videoId = typeof video.id === "string" ? video.id : video.id?.videoId;
  const publishedAt = snippet.publishedAt || snippet.publishTime;
  const duration = contentDetails.duration ? formatDuration(contentDetails.duration) : "";

  return (
    <Link to={`/watch?v=${videoId}`} className="group flex flex-col gap-4 py-4 sm:flex-row">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-[#1a1a1a] sm:w-[360px]">
        <img
          src={snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url}
          alt={snippet.title || "Video thumbnail"}
          className="h-full w-full object-cover"
        />
        {duration && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">{duration}</span>}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-base font-medium leading-snug text-black group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {snippet.title}
        </h2>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {statistics.viewCount ? `${formatView(statistics.viewCount)} views` : ""}
          {statistics.viewCount && publishedAt ? " · " : ""}
          {publishedAt ? formatPastInfo(publishedAt) : ""}
        </p>
        <p className="mt-3 text-xs text-gray-700 dark:text-gray-300">{snippet.channelTitle}</p>
        {snippet.description && <p className="mt-3 hidden line-clamp-2 text-sm text-gray-600 dark:text-gray-400 sm:block">{snippet.description}</p>}
      </div>
    </Link>
  );
};

export default SearchResultCard;
