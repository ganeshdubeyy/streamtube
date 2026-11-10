import VideoCard from "./VideoCard";
import VideoCardShimmer from "./VideoCardShimmer";
import { useSelector } from "react-redux";
import usePopularMovies from "../../hooks/usePopularMovies";

const VideoCardContainer = () => {
  const videosData = useSelector((store) => store.videos.popularVideos);
  const { loading, loaderRef, initialLoading, error, retry } = usePopularMovies();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 px-4 py-4 bg-white dark:bg-[#0f0f0f] min-h-screen">
      {initialLoading &&
        Array.from({ length: 16 }).map((_, index) => (
          <VideoCardShimmer key={index} />
        ))}
      {videosData.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
      {loading &&
        Array.from({ length: 16 }).map((_, index) => (
          <VideoCardShimmer key={index} />
        ))}
      {!initialLoading && error && (
        <div role="alert" className="col-span-full mx-auto max-w-xl rounded-xl border border-red-200 p-5 text-sm text-red-700 dark:border-red-900 dark:text-red-300">
          <p>{error}</p>
          <button type="button" onClick={retry} className="mt-3 rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f]">Retry</button>
        </div>
      )}
      {!initialLoading && !loading && !error && videosData.length === 0 && (
        <div className="col-span-full mx-auto max-w-xl py-16 text-center text-gray-600 dark:text-gray-300">No videos are available right now. Try again later.</div>
      )}
      <div ref={loaderRef}></div>
    </div>
  );
};

export default VideoCardContainer;
