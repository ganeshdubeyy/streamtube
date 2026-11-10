const VideoCardShimmer = () => {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative w-full aspect-video rounded-xl bg-gray-200 dark:bg-[#1a1a1a]" />

      <div className="flex gap-3 mt-3">
        <div className="flex-1 min-w-0">
          <div className="h-4 w-11/12 rounded bg-gray-200 dark:bg-[#272727]" />
          <div className="h-4 w-8/12 rounded bg-gray-200 dark:bg-[#272727] mt-2" />

          <div className="h-3 w-5/12 rounded bg-gray-200 dark:bg-[#272727] mt-3" />

          <div className="h-3 w-4/12 rounded bg-gray-200 dark:bg-[#272727] mt-2" />
        </div>

        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#272727] flex-shrink-0" />
      </div>
    </div>
  );
};

export default VideoCardShimmer;
