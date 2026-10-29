import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courrierReducer from './slices/courrierSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courriers: courrierReducer
  }
});