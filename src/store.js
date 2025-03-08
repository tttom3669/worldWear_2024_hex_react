import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slice/productsSlice';
import cartsReducer from './slice/cartsSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    carts: cartsReducer,
  },
});
