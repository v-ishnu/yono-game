import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

export interface Game {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoTitle?: string;
  category?: string;
  rating?: number;
  size?: string;
  signupBonus?: number;
  minWithdraw?: number;
  downloadUrl?: string;
  description?: string;
  longDescription?: string;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
  isNewGame?: boolean;
  isFree?: boolean;
  relatedApps?: string[];
  createdAt?: string;
}

interface GameState {
  games: Game[];
  selectedGame: Game | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: GameState = {
  games: [],
  selectedGame: null,
  loading: false,
  error: null,
  total: 0,
};

export const fetchGames = createAsyncThunk(
  "game/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/get-all-game");
      return res.data.data as Game[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch games");
    }
  }
);

export const fetchGameBySlug = createAsyncThunk(
  "game/fetchOne",
  async (slug: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/${slug}`);
      return res.data.data as Game;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch game");
    }
  }
);

export const createGame = createAsyncThunk(
  "game/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.post("/create-game", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as Game;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create game");
    }
  }
);

export const updateGame = createAsyncThunk(
  "game/update",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.patch("/update-game", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as Game;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update game");
    }
  }
);

export const deleteGame = createAsyncThunk(
  "game/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/delete-game/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete game");
    }
  }
);

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setSelectedGame(state, action) {
      state.selectedGame = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGameBySlug.pending, (state) => { state.loading = true; })
      .addCase(fetchGameBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedGame = action.payload;
      })
      .addCase(fetchGameBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createGame.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createGame.fulfilled, (state, action) => {
        state.loading = false;
        state.games.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateGame.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateGame.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.games.findIndex((g) => g._id === action.payload._id);
        if (idx !== -1) state.games[idx] = action.payload;
        state.selectedGame = action.payload;
      })
      .addCase(updateGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteGame.pending, (state) => { state.loading = true; })
      .addCase(deleteGame.fulfilled, (state, action) => {
        state.loading = false;
        state.games = state.games.filter((g) => g._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedGame, clearError } = gameSlice.actions;
export default gameSlice.reducer;
