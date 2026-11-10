import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { addVideoDetails } from '../utils/videoSlice';
import { YOUTUBE_API_KEY } from '../utils/constants';

const useVideoandChannelDetail = (videoId) => {
  const [channelInfo, setChannelInfo] = useState(null);
  const dispatch = useDispatch()

  const getVideoDetails = useCallback(async () => {
    const res = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`,
    );
    const data = await res.json();
    const video = data.items?.[0];
    if (!video) return;
    dispatch(addVideoDetails(video));


    const channelRes = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${video.snippet.channelId}&key=${YOUTUBE_API_KEY}`,
    );

    const channelData = await channelRes.json();
    setChannelInfo(channelData.items?.[0] || null);
  }, [videoId, dispatch]);

  useEffect(() => {
    setChannelInfo(null);
    getVideoDetails();
  }, [getVideoDetails]);

  return channelInfo
}

export default useVideoandChannelDetail
