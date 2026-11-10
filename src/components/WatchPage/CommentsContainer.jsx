import useComments from "../../hooks/useComments";
import { formatView } from "../../utils/helper";
import CommentCard from "./CommentCard";
import CommentCardShimmer from "./CommentCardShimmer";

const CommentsContainer = ({ videoId, totalComments }) => {
  const { comments, loading, loaderRef } = useComments(videoId);
  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-black dark:text-white mb-6">
        {totalComments ? `${formatView(totalComments)} Comments` : "Comments"}
      </h3>

      <div className="flex flex-col gap-6">
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {loading &&
          Array.from({ length: 5 }).map((_, index) => (
            <CommentCardShimmer key={index} />
          ))}
      </div>
      <div ref={loaderRef}></div>
    </div>
  );
};

export default CommentsContainer;
