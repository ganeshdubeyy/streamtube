const CommentCardShimmer = () => {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#272727] flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#272727]" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-[#272727]" />
        </div>

        <div className="h-3 w-11/12 rounded bg-gray-200 dark:bg-[#272727] mt-2" />
        <div className="h-3 w-7/12 rounded bg-gray-200 dark:bg-[#272727] mt-2" />

        <div className="flex items-center gap-4 mt-3">
          <div className="h-4 w-8 rounded bg-gray-200 dark:bg-[#272727]" />
          <div className="h-4 w-8 rounded bg-gray-200 dark:bg-[#272727]" />
          <div className="h-3 w-10 rounded bg-gray-200 dark:bg-[#272727]" />
        </div>
      </div>
    </div>
  );
};

export default CommentCardShimmer;
