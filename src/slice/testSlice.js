import { createSlice } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    count: 0,
  },
  reducers: {
    addCount: (state) => {
      state.count += 1;
    },
  },
});
export const countData = (state) => state.counter.count;
export const { addCount } = counterSlice.actions;

export default counterSlice.reducer;
