import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Clapperboard } from "lucide-react";
import { YOUTUBE_API_KEY } from "../../utils/constants";

export default function ShortsPage() {
  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadShortVideos = async () => {
      setLoading(true);
      setError("");
      try {
        const searchParams = new URLSearchParams({
          part: "snippet",
          type: "video",
          q: "#shorts",
          videoDuration: "short",
          videoEmbeddable: "true",
          maxResults: "25",
          order: "relevance",
          key: YOUTUBE_API_KEY,
        });
        const searchResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/search?${searchParams}`);
        const searchData = await searchResponse.json();
        if (!searchResponse.ok || searchData.error) throw new Error(searchData.error?.message || "Could not load short-form videos.");
        const ids = searchData.items?.map((item) => item.id?.videoId).filter(Boolean) || [];
        if (ids.length === 0) {
          if (active) setVideos([]);
          return;
        }
        const detailsParams = new URLSearchParams({
          part: "snippet,contentDetails,statistics",
          id: ids.join(","),
          key: YOUTUBE_API_KEY,
        });
        const detailsResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${detailsParams}`);
        const detailsData = await detailsResponse.json();
        if (!detailsResponse.ok || detailsData.error) throw new Error(detailsData.error?.message || "Could not load video details.");
        const detailMap = new Map((detailsData.items || []).map((video) => [video.id, video]));
        const results = ids.map((id) => detailMap.get(id)).filter(Boolean);
        if (active) setVideos(results);
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load short-form videos.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadShortVideos();
    return () => { active = false; };
  }, []);

  const currentVideo = videos[activeIndex];
  const move = (direction) => setActiveIndex((index) => (index + direction + videos.length) % videos.length);

  return (
    <main className="min-h-screen bg-white px-4 py-6 dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <Clapperboard className="text-red-600" />
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">Short-form videos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">YouTube search results for #shorts. Some results may not use YouTube’s Shorts format.</p>
          </div>
        </div>

        {loading && <div className="grid min-h-96 place-items-center text-sm text-gray-500">Loading short-form videos…</div>}
        {!loading && error && (
          <div role="alert" className="rounded-xl border border-red-200 p-5 text-sm text-red-700 dark:border-red-900 dark:text-red-300">
            <p>{error}</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Check your YouTube API key, enabled API, or quota.</p>
          </div>
        )}
        {!loading && !error && !currentVideo && (
          <div className="rounded-xl border border-gray-200 p-10 text-center text-gray-600 dark:border-[#303030] dark:text-gray-300">No short-form results were found. Try again later.</div>
        )}

        {!loading && !error && currentVideo && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
            <div className="relative aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-2xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=1&controls=1`}
                title={currentVideo.snippet.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="flex flex-row gap-3 sm:flex-col sm:self-center">
              <button type="button" onClick={() => move(-1)} disabled={videos.length < 2} aria-label="Previous video" className="rounded-full bg-gray-100 p-3 text-black hover:bg-gray-200 disabled:opacity-40 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f]"><ArrowUp /></button>
              <button type="button" onClick={() => move(1)} disabled={videos.length < 2} aria-label="Next video" className="rounded-full bg-gray-100 p-3 text-black hover:bg-gray-200 disabled:opacity-40 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f]"><ArrowDown /></button>
            </div>
            <div className="w-full max-w-[340px] sm:self-center">
              <p className="font-medium text-black dark:text-white">{currentVideo.snippet.title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{currentVideo.snippet.channelTitle}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{activeIndex + 1} of {videos.length}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
