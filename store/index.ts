import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import gameReducer from "./slices/gameSlice";
import adminReducer from "./slices/adminSlice";
import mediaReducer from "./slices/mediaSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    admins: adminReducer,
    media: mediaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
