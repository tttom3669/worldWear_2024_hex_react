import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slice/productsSlice';
import cartsReducer from './slice/cartsSlice';
import productsListReducer from './slice/productsListSlice';
import favoritesReducer from './slice/favoritesSlice';
import authSliceReducer from './slice/authSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    carts: cartsReducer,
    productsList: productsListReducer,
    favorites: favoritesReducer,
    authSlice: authSliceReducer,
  },
});
