import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux';
import { addPopularMovies } from '../utils/videoSlice';
import { YOUTUBE_API_KEY } from './../utils/constants';

const usePopularMovies = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState("");
  const loaderRef = useRef(null);
  const dispatch = useDispatch();

  const getPopularVideos = useCallback(async () => {
    if (nextPageToken === undefined) return;

    if (loading) return;
    if (!initialLoading) setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&chart=mostPopular&maxResults=50${nextPageToken ? "&pageToken=" + nextPageToken : ""}&regionCode=in&key=${YOUTUBE_API_KEY}`,
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || "Could not load popular videos.");
      dispatch(addPopularMovies(data.items || []));
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      console.error("Popular videos error:", err);
      setError(err.message || "Could not load videos. Please try again.");
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [nextPageToken, loading, initialLoading, dispatch]);

  useEffect(() => {
    if (initialLoading) getPopularVideos();
    let observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageToken && !error) {
        getPopularVideos();
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [getPopularVideos, initialLoading, nextPageToken, error]);

  return {
    initialLoading, loaderRef, loading, error, retry: getPopularVideos
  }
}

export default usePopularMovies;
