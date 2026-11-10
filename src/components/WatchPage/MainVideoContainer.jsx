import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreHorizontal,
  BadgeCheck,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { formatView } from "../../utils/helper";
import CommentsContainer from "./CommentsContainer";
import MainVideoShimmer from "./MainVideoShimmer";
import { useSelector } from "react-redux";
import useVideoandChannelDetail from "../../hooks/useVideoandChannelDetail";
import { isChannelSubscribed, isVideoDisliked, isVideoLiked, isVideoSaved, recordVideoView, subscribeToLibrary, toggleChannelSubscription, toggleVideoDislike, toggleVideoLike, toggleWatchLater } from "../../utils/videoLibrary";
import AddToPlaylistButton from "../Library/AddToPlaylistButton";
import { loadYouTubeIframeApi } from "../../utils/youtubeIframeApi";

const MainVideoContainer = () => {
  const [searchParam] = useSearchParams();
  const videoId = searchParam.get("v");
  const channelInfo = useVideoandChannelDetail(videoId);
  const [subscribed, setSubscribed] = useState(false);
  const videoDetails = useSelector((store) => store.videos.videoDetails);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [saved, setSaved] = useState(() => isVideoSaved(videoId));
  const [liked, setLiked] = useState(() => isVideoLiked(videoId));
  const [disliked, setDisliked] = useState(() => isVideoDisliked(videoId));
  const [actionMessage, setActionMessage] = useState("");
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const { snippet, statistics } = videoDetails || {};
  const channelId = channelInfo?.id;

  useEffect(() => {
    if (!videoId || videoDetails?.id !== videoId || !channelId) return undefined;
    let cancelled = false;
    let playerInstance;
    const playerHost = playerHostRef.current;
    setPlayerReady(false);
    setPlayerError("");

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerHost) return;
      const mount = document.createElement("div");
      playerHost.replaceChildren(mount);
      playerInstance = new YT.Player(mount, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (cancelled) {
              event.target.destroy();
              return;
            }
            event.target.getIframe().style.width = "100%";
            event.target.getIframe().style.height = "100%";
            playerRef.current = event.target;
            setPlayerReady(true);
          },
          onError: (event) => {
            if (!cancelled) setPlayerError(`YouTube player error (${event.data}). Some videos may not allow embedded playback.`);
          },
        },
      });
      playerRef.current = playerInstance;
    }).catch((error) => {
      if (!cancelled) setPlayerError(error.message || "Could not initialize the YouTube player.");
    });

    return () => {
      cancelled = true;
      setPlayerReady(false);
      playerRef.current = null;
      playerInstance?.destroy();
      playerHost?.replaceChildren();
    };
  }, [videoId, videoDetails?.id, channelId]);

  useEffect(() => {
    if (!playerReady) return undefined;

    const skip = (seconds) => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !player?.seekTo) return;
      player.seekTo(Math.max(0, player.getCurrentTime() + seconds), true);
    };

    const handlePlayerKeys = (event) => {
      const target = event.target;
      if (target?.isContentEditable || target?.closest?.("input, textarea, select, button, a, summary, [role='button']")) return;
      const player = playerRef.current;
      if (!player) return;

      const key = event.key.toLowerCase();
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        skip(-5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        skip(5);
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        player.setVolume(Math.max(0, Math.min(100, player.getVolume() + (event.key === "ArrowUp" ? 5 : -5))));
      } else if (key === "j") {
        event.preventDefault();
        skip(-10);
      } else if (key === "l") {
        event.preventDefault();
        skip(10);
      } else if (key === "k" || event.code === "Space") {
        event.preventDefault();
        if (player.getPlayerState() === window.YT.PlayerState.PLAYING) player.pauseVideo();
        else player.playVideo();
      } else if (key === "m") {
        event.preventDefault();
        if (player.isMuted()) player.unMute();
        else player.mute();
      } else if (key === "f") {
        event.preventDefault();
        const iframe = player.getIframe();
        if (document.fullscreenElement) document.exitFullscreen?.();
        else iframe?.requestFullscreen?.();
      } else if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const duration = player.getDuration();
        if (duration > 0) player.seekTo(duration * (Number(event.key) / 10), true);
      }
    };

    document.addEventListener("keydown", handlePlayerKeys);
    return () => document.removeEventListener("keydown", handlePlayerKeys);
  }, [playerReady]);

  useEffect(() => {
    setSaved(isVideoSaved(videoId));
    setLiked(isVideoLiked(videoId));
    setDisliked(isVideoDisliked(videoId));
    return subscribeToLibrary((key) => {
      if (!key || key === "streamtubeWatchLater") setSaved(isVideoSaved(videoId));
      if (!key || key === "streamtubeLikedVideos") setLiked(isVideoLiked(videoId));
      if (!key || key === "streamtubeDislikedVideos") setDisliked(isVideoDisliked(videoId));
    });
  }, [videoId]);

  useEffect(() => {
    setSubscribed(isChannelSubscribed(channelInfo?.id));
    return subscribeToLibrary((key) => {
      if (!key || key === "streamtubeSubscriptions") {
        setSubscribed(isChannelSubscribed(channelInfo?.id));
      }
    });
  }, [channelInfo?.id]);

  useEffect(() => {
    if (videoDetails?.id === videoId) recordVideoView(videoDetails);
  }, [videoDetails, videoId]);

  const showActionMessage = (message) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 3500);
  };

  const shareVideo = async () => {
    const url = `${window.location.origin}/watch?v=${videoId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: snippet?.title || "StreamTube video", url });
        showActionMessage("Video shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showActionMessage("Video link copied to clipboard.");
      } else {
        showActionMessage(`Copy this video link: ${url}`);
      }
    } catch (error) {
      if (error?.name !== "AbortError") showActionMessage("Could not share the video. Copy its URL from the address bar.");
    }
  };

  if (!videoDetails || !channelInfo) return <MainVideoShimmer />;

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-4 bg-white dark:bg-[#0f0f0f] min-h-screen">
      <div className="flex-1 min-w-0 max-w-[1000px]">
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          {videoId ? (
            <div ref={playerHostRef} className="h-full w-full" aria-label="YouTube video player" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No video selected
            </div>
          )}
        </div>
        {playerError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{playerError}</p>}
        {videoId && <details className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <summary className="w-fit cursor-pointer select-none">Keyboard shortcuts</summary>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <li>← / →: seek 5 seconds</li>
            <li>J / L: seek 10 seconds</li>
            <li>K or Space: play / pause</li>
            <li>↑ / ↓: volume up / down</li>
            <li>M: mute / unmute</li>
            <li>F: fullscreen</li>
            <li>0–9: jump to that part of the video</li>
          </ul>
        </details>}

        <h1 className="text-lg font-semibold text-black dark:text-white mt-4">
          {snippet?.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-3">
            <img
              src={channelInfo.snippet.thumbnails.medium.url}
              alt="channel"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-black dark:text-white">
                  {snippet.channelTitle}
                </p>
                <BadgeCheck
                  size={14}
                  className="text-gray-500 dark:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatView(channelInfo.statistics.subscriberCount)} Subscribers
              </p>
            </div>
            <button
              onClick={() => setSubscribed(toggleChannelSubscription(channelInfo))}
              className={`ml-3 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                subscribed
                  ? "bg-gray-100 dark:bg-[#272727] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#3f3f3f]"
                  : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
              }`}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 dark:bg-[#272727] rounded-full overflow-hidden">
              <button
                type="button"
                onClick={() => setLiked(toggleVideoLike(videoDetails))}
                aria-pressed={liked}
                title="Like on this device"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3f3f3f] ${liked ? "text-blue-600 dark:text-blue-400" : "text-black dark:text-white"}`}
              >
                <ThumbsUp size={18} strokeWidth={1.8} fill={liked ? "currentColor" : "none"} />
                {formatView(statistics.likeCount)}
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-[#3f3f3f]" />
              <button
                type="button"
                onClick={() => setDisliked(toggleVideoDislike(videoDetails))}
                aria-pressed={disliked}
                title="Dislike on this device"
                className={`px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3f3f3f] ${disliked ? "text-blue-600 dark:text-blue-400" : "text-black dark:text-white"}`}
              >
                <ThumbsDown size={18} strokeWidth={1.8} fill={disliked ? "currentColor" : "none"} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSaved(toggleWatchLater(videoDetails))}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f]"
              aria-pressed={saved}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              {saved ? "Saved" : "Watch later"}
            </button>
            <AddToPlaylistButton video={videoDetails} />

            <button type="button" onClick={shareVideo} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-[#272727] text-sm font-medium text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#3f3f3f] transition-colors cursor-pointer">
              <Share2 size={18} strokeWidth={1.8} />
              Share
            </button>

            <button type="button" onClick={() => showActionMessage("StreamTube can’t download YouTube videos. Use YouTube’s official offline feature where it’s available.")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-[#272727] text-sm font-medium text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#3f3f3f] transition-colors cursor-pointer">
              <Download size={18} strokeWidth={1.8} />
              Download info
            </button>

            <button className="p-2 rounded-full bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#3f3f3f] transition-colors cursor-pointer">
              <MoreHorizontal
                size={18}
                className="text-black dark:text-white"
              />
            </button>
          </div>
        </div>
        {actionMessage && <p role="status" className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-[#272727] dark:text-gray-200">{actionMessage}</p>}

        <div
          className="mt-3 bg-gray-100 dark:bg-[#272727] rounded-xl p-3 cursor-pointer"
          onClick={() => setShowFullDesc(!showFullDesc)}
        >
          <p className="text-sm font-medium text-black dark:text-white">
            {formatView(statistics.viewCount)} views • &nbsp;
            {new Date(snippet.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p
            className={`text-sm text-black dark:text-white mt-1 whitespace-pre-line break-all ${
              showFullDesc ? "" : "line-clamp-2"
            }`}
          >
            {snippet.description}
          </p>
          <button className="flex items-center gap-1 text-sm font-medium text-black dark:text-white mt-1">
            {showFullDesc ? "Show less" : "Show more"}
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showFullDesc ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="mt-6">
          <CommentsContainer
            videoId={videoId}
            totalComments={statistics.commentCount}
          />
        </div>
      </div>
    </div>
  );
};

export default MainVideoContainer;
