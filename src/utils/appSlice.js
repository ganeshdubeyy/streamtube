import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isOpen: true,
  isMobileOpen: false,
  inputSearch: '',
  showSuggestions: false
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSideBar: (state) => {
      state.isOpen = !state.isOpen
    },
    toggleMobileSidebar: (state) => {
      state.isMobileOpen = !state.isMobileOpen
    },
    closeMobileSidebar: (state) => {
      state.isMobileOpen = false
    },
    addInputSearchValue: (state, action) => {
      state.inputSearch = action.payload
    },
    clearInputSearch:(state)=>{
      state.inputSearch=""
    },
    toggleShowSuggestion: (state) => {
      state.showSuggestions = !state.showSuggestions
    }
  },
})

export const { toggleSideBar, toggleMobileSidebar, closeMobileSidebar, addInputSearchValue, toggleShowSuggestion,clearInputSearch } = appSlice.actions

export default appSlice.reducer
