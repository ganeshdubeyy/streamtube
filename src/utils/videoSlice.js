import { createSlice } from "@reduxjs/toolkit";

const videoSlice = createSlice({
  name: "video",
  initialState: {
    popularVideos: [],
    videoDetails: null,
  },
  reducers: {
    addPopularMovies: (state, action) => {
      state.popularVideos.push(...action.payload);
    },
    addVideoDetails: (state, action) => {
      state.videoDetails = action.payload;
    },
  },
});

export default videoSlice.reducer;
export const { addPopularMovies, addVideoDetails } = videoSlice.actions;
