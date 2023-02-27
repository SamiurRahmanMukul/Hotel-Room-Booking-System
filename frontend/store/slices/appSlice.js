import { createSlice } from '@reduxjs/toolkit';

export const appSlice = createSlice({
  name: 'app',
  initialState: {
    timeZone: '',
    isLoading: false,
    theme: {
      colorPrimary: '#6773FF',
      colorLink: '#5189f5'
    }
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  }
});

// Action creators are generated for each case reducer function
export const { setLoading } = appSlice.actions;

export default appSlice.reducer;
