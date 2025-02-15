import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slice/testSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
