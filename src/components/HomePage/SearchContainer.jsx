import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SearchResultCard from "../WatchPage/SearchResultCard";
import { YOUTUBE_API_KEY } from "../../utils/constants";

const SearchContainer = () => {
  const [queryResults, setQueryResults] = useState([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search_query")?.trim() || "";
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!query) {
      setQueryResults([]);
      setLoading(false);
      setError("");
      return () => { active = false; };
    }

    const getResults = async () => {
      setLoading(true);
      setError("");
      setQueryResults([]);
      try {
        const searchParams = new URLSearchParams({
          part: "snippet",
          maxResults: "20",
          q: query,
          type: "video",
          regionCode: "IN",
          key: YOUTUBE_API_KEY,
        });
        const searchResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/search?${searchParams}`);
        const searchData = await searchResponse.json();
        if (!searchResponse.ok || searchData.error) throw new Error(searchData.error?.message || "YouTube search failed.");
        const ids = searchData.items?.map((item) => item.id?.videoId).filter(Boolean) || [];
        if (ids.length === 0) {
          if (active) setQueryResults([]);
          return;
        }

        const videoParams = new URLSearchParams({
          part: "snippet,contentDetails,statistics",
          id: ids.join(","),
          key: YOUTUBE_API_KEY,
        });
        const videosResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${videoParams}`);
        const videosData = await videosResponse.json();
        if (!videosResponse.ok || videosData.error) throw new Error(videosData.error?.message || "Could not load video details.");
        const videoMap = new Map((videosData.items || []).map((video) => [video.id, video]));
        const results = ids.map((id) => videoMap.get(id)).filter(Boolean);
        if (active) setQueryResults(results);
      } catch (loadError) {
        if (active) setError(loadError.message || "Search failed. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    getResults();
    return () => { active = false; };
  }, [query]);

  return (
    <main className="min-h-screen bg-white px-4 py-4 dark:bg-[#0f0f0f] sm:px-6">
      <div className="mx-auto max-w-5xl">
        {!query ? (
          <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
            <p className="text-gray-600 dark:text-gray-300">Enter a search term to find videos.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Go to home</Link>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Search results for <span className="font-medium">“{query}”</span></p>
            {loading && <div className="space-y-4" aria-label="Loading search results">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex animate-pulse gap-4 py-2"><div className="aspect-video w-40 shrink-0 rounded-xl bg-gray-200 dark:bg-[#272727] sm:w-64" /><div className="flex-1 space-y-3"><div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[#272727]" /><div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-[#272727]" /><div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-[#272727]" /></div></div>)}</div>}
            {!loading && error && <div role="alert" className="rounded-xl border border-red-200 p-5 text-sm text-red-700 dark:border-red-900 dark:text-red-300"><p>{error}</p><p className="mt-2 text-gray-600 dark:text-gray-400">Check your API key, YouTube Data API access, and quota.</p></div>}
            {!loading && !error && queryResults.length === 0 && <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]"><p className="text-gray-600 dark:text-gray-300">No videos found for “{query}”.</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try another search phrase.</p></div>}
            {!loading && !error && queryResults.length > 0 && <div className="flex flex-col divide-y divide-gray-200 dark:divide-[#272727]">{queryResults.map((video) => <SearchResultCard key={video.id} video={video} />)}</div>}
          </>
        )}
      </div>
    </main>
  );
};

export default SearchContainer;
