import { ThumbsUp, ThumbsDown } from "lucide-react";
import { formatView } from "../../utils/helper";

const CommentCard = ({ comment }) => {
  const snippet = comment?.snippet?.topLevelComment?.snippet;
  if (!snippet) return null;

  return (
    <div className="flex gap-3">
      <img
        src={snippet.authorProfileImageUrl}
        alt={snippet.authorDisplayName}
        className="w-10 h-10 rounded-full flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black dark:text-white">
            {snippet.authorDisplayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(snippet.publishedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <p
          className="text-sm text-black dark:text-white mt-1 leading-snug [overflow-wrap:anywhere]"
          dangerouslySetInnerHTML={{ __html: snippet.textDisplay }}
        />

        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
            <ThumbsUp size={15} strokeWidth={1.8} />
            {snippet.likeCount > 0 && (
              <span className="text-xs">{formatView(snippet.likeCount)}</span>
            )}
          </button>

          <button className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
            <ThumbsDown size={15} strokeWidth={1.8} />
          </button>

          <button className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
