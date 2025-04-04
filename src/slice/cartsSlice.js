import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
const { VITE_API_PATH: API_PATH } = import.meta.env;

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

export const asyncGetCarts = createAsyncThunk(
  'asyncGetCarts',
  async function (payload, { dispatch, getState }) {
    const userId =
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`worldWearUserId`))
        ?.split('=')[1] || '';

    const res = await axios.get(
      `${API_PATH}/carts/?userId=${userId}&_expand=user&_expand=product`
    );
    const currentCartsData = getState().carts.cartsData;

    dispatch(
      cartsSlice.actions.setCartsData({
        ...currentCartsData,
        products: [...res.data],
      })
    );
  }
);

export default cartsSlice.reducer;
