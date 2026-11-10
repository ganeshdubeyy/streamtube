import { useCallback, useEffect, useRef, useState } from "react";
import { YOUTUBE_API_KEY } from "../utils/constants";
const useComments = (videoId) => {
  const [comments, setComments] = useState([]);
  const [nextPageToken, setNextPageToken] = useState("");
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef();
  const fetchComments = useCallback(async () => {
    if (nextPageToken === undefined) return;
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=30&pageToken=${nextPageToken && nextPageToken}&key=${YOUTUBE_API_KEY}`,
      );
      const data = await res.json();
      setComments((prev) => [...prev, ...(data.items || [])]);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      console.error("Comments fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [videoId, nextPageToken, loading]);

  useEffect(() => {
    let observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchComments();
      }
    });
    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [fetchComments]);

  return { comments, loading, loaderRef }
}

export default useComments
