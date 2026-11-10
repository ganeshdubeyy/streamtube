const LIBRARY_EVENT = "streamtube:library-change";
export { LIBRARY_EVENT };

export const LIBRARY_STORAGE_KEYS = [
  "streamtubeHistory",
  "streamtubeLikedVideos",
  "streamtubeDislikedVideos",
  "streamtubeWatchLater",
  "streamtubePlaylists",
  "streamtubeSubscriptions",
];

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeList = (key, videos, source = "local") => {
  localStorage.setItem(key, JSON.stringify(videos));
  window.dispatchEvent(new CustomEvent(LIBRARY_EVENT, { detail: { key, source } }));
};

export const readLibrarySnapshot = () => Object.fromEntries(
  LIBRARY_STORAGE_KEYS.map((key) => [key, readList(key)]),
);

export const applyLibrarySnapshot = (snapshot) => {
  LIBRARY_STORAGE_KEYS.forEach((key) => {
    const value = Array.isArray(snapshot?.[key]) ? snapshot[key] : [];
    localStorage.setItem(key, JSON.stringify(value));
  });
  window.dispatchEvent(new CustomEvent(LIBRARY_EVENT, { detail: { key: null, source: "cloud" } }));
};

export const toLibraryVideo = (video) => {
  const id = typeof video?.id === "string" ? video.id : video?.id?.videoId;
  if (!id || !video?.snippet) return null;

  return {
    id,
    snippet: video.snippet,
    statistics: video.statistics || {},
    contentDetails: video.contentDetails || {},
  };
};

export const getLibraryVideos = (key) => readList(key);

export const getPlaylists = () => readList("streamtubePlaylists");

export const getSubscribedChannels = () => readList("streamtubeSubscriptions");

export const isChannelSubscribed = (channelId) =>
  getSubscribedChannels().some((channel) => channel.id === channelId);

export const toggleChannelSubscription = (channel) => {
  if (!channel?.id || !channel.snippet) return false;
  const subscriptions = getSubscribedChannels();
  const exists = subscriptions.some((item) => item.id === channel.id);
  if (exists) {
    writeList("streamtubeSubscriptions", subscriptions.filter((item) => item.id !== channel.id));
    return false;
  }
  const savedChannel = {
    id: channel.id,
    title: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails?.default?.url || channel.snippet.thumbnails?.medium?.url || "",
    subscriberCount: channel.statistics?.subscriberCount || "0",
    subscribedAt: Date.now(),
  };
  writeList("streamtubeSubscriptions", [savedChannel, ...subscriptions]);
  return true;
};

export const removeChannelSubscription = (channelId) => {
  writeList(
    "streamtubeSubscriptions",
    getSubscribedChannels().filter((channel) => channel.id !== channelId),
  );
};

export const createPlaylist = (name) => {
  const cleanName = name.trim();
  if (!cleanName) return null;
  const playlists = getPlaylists();
  if (playlists.some((playlist) => playlist.name.toLowerCase() === cleanName.toLowerCase())) return null;
  const playlist = {
    id: globalThis.crypto?.randomUUID?.() || `playlist-${Date.now()}`,
    name: cleanName,
    videos: [],
    createdAt: Date.now(),
  };
  writeList("streamtubePlaylists", [playlist, ...playlists]);
  return playlist;
};

export const deletePlaylist = (playlistId) => {
  writeList("streamtubePlaylists", getPlaylists().filter((playlist) => playlist.id !== playlistId));
};

export const renamePlaylist = (playlistId, name) => {
  const cleanName = name.trim();
  if (!cleanName) return false;
  const playlists = getPlaylists();
  if (playlists.some((playlist) => playlist.id !== playlistId && playlist.name.toLowerCase() === cleanName.toLowerCase())) return false;
  writeList("streamtubePlaylists", playlists.map((playlist) =>
    playlist.id === playlistId ? { ...playlist, name: cleanName } : playlist,
  ));
  return true;
};

export const addVideoToPlaylist = (playlistId, video) => {
  const normalized = toLibraryVideo(video);
  if (!normalized) return false;
  let added = false;
  const currentPlaylists = getPlaylists();
  const playlists = currentPlaylists.map((playlist) => {
    if (playlist.id !== playlistId || playlist.videos.some((item) => item.id === normalized.id)) return playlist;
    added = true;
    return { ...playlist, videos: [{ ...normalized, addedAt: Date.now() }, ...playlist.videos] };
  });
  if (added) {
    writeList("streamtubePlaylists", playlists);
  }
  return added;
};

export const removeVideoFromPlaylist = (playlistId, videoId) => {
  const playlists = getPlaylists().map((playlist) =>
    playlist.id === playlistId
      ? { ...playlist, videos: playlist.videos.filter((video) => video.id !== videoId) }
      : playlist,
  );
  writeList("streamtubePlaylists", playlists);
};

export const isVideoLiked = (videoId) =>
  readList("streamtubeLikedVideos").some((video) => video.id === videoId);

export const toggleVideoLike = (video) => {
  const normalized = toLibraryVideo(video);
  if (!normalized) return false;
  const likedVideos = readList("streamtubeLikedVideos");
  const exists = likedVideos.some((item) => item.id === normalized.id);
  if (!exists) {
    writeList(
      "streamtubeDislikedVideos",
      readList("streamtubeDislikedVideos").filter((item) => item.id !== normalized.id),
    );
  }
  writeList(
    "streamtubeLikedVideos",
    exists
      ? likedVideos.filter((item) => item.id !== normalized.id)
      : [{ ...normalized, likedAt: Date.now() }, ...likedVideos],
  );
  return !exists;
};

export const isVideoDisliked = (videoId) =>
  readList("streamtubeDislikedVideos").some((video) => video.id === videoId);

export const toggleVideoDislike = (video) => {
  const normalized = toLibraryVideo(video);
  if (!normalized) return false;
  const dislikedVideos = readList("streamtubeDislikedVideos");
  const exists = dislikedVideos.some((item) => item.id === normalized.id);
  if (!exists) {
    writeList(
      "streamtubeLikedVideos",
      readList("streamtubeLikedVideos").filter((item) => item.id !== normalized.id),
    );
  }
  writeList(
    "streamtubeDislikedVideos",
    exists
      ? dislikedVideos.filter((item) => item.id !== normalized.id)
      : [{ ...normalized, dislikedAt: Date.now() }, ...dislikedVideos],
  );
  return !exists;
};

export const isVideoSaved = (videoId) =>
  readList("streamtubeWatchLater").some((video) => video.id === videoId);

export const toggleWatchLater = (video) => {
  const normalized = toLibraryVideo(video);
  if (!normalized) return false;

  const current = readList("streamtubeWatchLater");
  const exists = current.some((item) => item.id === normalized.id);
  writeList(
    "streamtubeWatchLater",
    exists
      ? current.filter((item) => item.id !== normalized.id)
      : [{ ...normalized, savedAt: Date.now() }, ...current],
  );
  return !exists;
};

export const removeLibraryVideo = (key, videoId) => {
  writeList(key, readList(key).filter((video) => video.id !== videoId));
};

export const recordVideoView = (video) => {
  const normalized = toLibraryVideo(video);
  if (!normalized) return;
  const remaining = readList("streamtubeHistory").filter(
    (item) => item.id !== normalized.id,
  );
  writeList("streamtubeHistory", [
    { ...normalized, watchedAt: Date.now() },
    ...remaining,
  ].slice(0, 100));
};

export const subscribeToLibrary = (callback) => {
  const handleChange = (event) => callback(event.detail?.key);
  window.addEventListener(LIBRARY_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(LIBRARY_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
};
