import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isLoading: false,
  isMobileMenuOpen: false,
  isSearchModalOpen: false,
  theme: "light",
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    toggleSearchModal: (state) => {
      state.isSearchModalOpen = !state.isSearchModalOpen
    },
    closeSearchModal: (state) => {
      state.isSearchModalOpen = false
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
  },
})

export const { setLoading, toggleMobileMenu, closeMobileMenu, toggleSearchModal, closeSearchModal, setTheme } =
  uiSlice.actions

export default uiSlice.reducer
