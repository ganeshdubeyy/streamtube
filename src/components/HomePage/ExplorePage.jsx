import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { YOUTUBE_API_KEY } from "../../utils/constants";
import VideoCard from "./VideoCard";
import VideoCardShimmer from "./VideoCardShimmer";

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setCategoryLoading(true);
      try {
        const params = new URLSearchParams({ part: "snippet", regionCode: "IN", key: YOUTUBE_API_KEY });
        const response = await fetch(`https://youtube.googleapis.com/youtube/v3/videoCategories?${params}`);
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error?.message || "Could not load categories.");
        if (active) setCategories((data.items || []).filter((category) => category.snippet?.assignable));
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load categories.");
      } finally {
        if (active) setCategoryLoading(false);
      }
    };
    loadCategories();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setVideos([]);
      setVideoLoading(false);
      return undefined;
    }
    let active = true;
    const loadCategoryVideos = async () => {
      setVideoLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          part: "snippet,contentDetails,statistics",
          chart: "mostPopular",
          maxResults: "50",
          regionCode: "IN",
          videoCategoryId: categoryId,
          key: YOUTUBE_API_KEY,
        });
        const response = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${params}`);
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error?.message || "Could not load this category.");
        if (active) setVideos(data.items || []);
      } catch (loadError) {
        if (active) {
          setVideos([]);
          setError(loadError.message || "Could not load this category.");
        }
      } finally {
        if (active) setVideoLoading(false);
      }
    };
    loadCategoryVideos();
    return () => { active = false; };
  }, [categoryId]);

  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <main className="min-h-screen bg-white px-4 py-6 dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="mb-4 text-2xl font-semibold text-black dark:text-white">Explore</h1>
        {categoryLoading ? (
          <p className="mb-5 text-sm text-gray-500">Loading YouTube categories…</p>
        ) : categories.length > 0 ? (
          <nav aria-label="Video categories" className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/explore?categoryId=${category.id}`}
                aria-current={category.id === categoryId ? "page" : undefined}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${category.id === categoryId ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f]"}`}
              >
                {category.snippet.title}
              </Link>
            ))}
          </nav>
        ) : null}

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:text-red-300">{error}</div>}
        {!categoryId && !categoryLoading && !error && (
          <div className="rounded-xl border border-gray-200 p-10 text-center text-gray-600 dark:border-[#303030] dark:text-gray-300">Choose a category to browse its popular videos.</div>
        )}
        {categoryId && selectedCategory && <h2 className="mb-4 text-lg font-medium text-black dark:text-white">Popular in {selectedCategory.snippet.title}</h2>}
        {videoLoading && <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <VideoCardShimmer key={index} />)}</div>}
        {!videoLoading && !error && categoryId && videos.length === 0 && (
          <div className="rounded-xl border border-gray-200 p-10 text-center text-gray-600 dark:border-[#303030] dark:text-gray-300">No popular videos were found for this category in your region.</div>
        )}
        {!videoLoading && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        )}
      </div>
    </main>
  );
}
