import { createSlice } from '@reduxjs/toolkit';

export const cartsSlice = createSlice({
  name: 'carts',
  initialState: {
    cartsData: {
      total: 0,
      final_total: 0,
      products: [],
    },
  },
  reducers: {
    setCartsData(state, action) {
      state.cartsData = { ...action.payload };
    },
  },
});

export const cartsData = (state) => state.carts.cartsData;

export const { setCartsData } = cartsSlice.actions;

export default cartsSlice.reducer;
