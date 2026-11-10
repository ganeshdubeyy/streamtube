import { createSlice } from "@reduxjs/toolkit";


export const searchSlice = createSlice({
  name: 'search',
  initialState: {},
  reducers: {
    addtoCache: (state, action) => {
      return { ...state, ...action.payload }
    }
  }
})

export default searchSlice.reducer
export const {addtoCache}=searchSlice.actions