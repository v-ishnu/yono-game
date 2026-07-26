import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { createGame, updateGame } from "@/store/slices/gameSlice";

export interface MediaItem {
  _id: string;
  url: string;
  filename: string;
  alt: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MediaState {
  mediaList: MediaItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MediaState = {
  mediaList: [],
  loading: false,
  error: null,
};

export const fetchMedia = createAsyncThunk(
  "media/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/media");
      return res.data.data as MediaItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch media");
    }
  }
);

export const uploadMedia = createAsyncThunk(
  "media/upload",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as MediaItem;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload media");
    }
  }
);

export const updateMediaSeo = createAsyncThunk(
  "media/updateSeo",
  async ({ id, alt, title }: { id: string; alt: string; title: string }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/media/${id}`, { alt, title });
      return res.data.data as MediaItem;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update media SEO");
    }
  }
);

export const deleteMedia = createAsyncThunk(
  "media/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/media/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete media");
    }
  }
);

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    clearMediaError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMedia.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.mediaList = action.payload;
      })
      .addCase(fetchMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload
      .addCase(uploadMedia.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        state.loading = false;
        const exists = state.mediaList.some((m) => m._id === action.payload._id || m.url === action.payload.url);
        if (!exists) {
          state.mediaList.unshift(action.payload);
        }
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update SEO
      .addCase(updateMediaSeo.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateMediaSeo.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.mediaList.findIndex((m) => m._id === action.payload._id);
        if (idx !== -1) {
          state.mediaList[idx] = action.payload;
        }
      })
      .addCase(updateMediaSeo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteMedia.pending, (state) => { state.loading = true; })
      .addCase(deleteMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.mediaList = state.mediaList.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Live updates when logos are uploaded via Game creation or update
      .addCase(createGame.fulfilled, (state, action) => {
        if (action.payload?.logoUrl) {
          const exists = state.mediaList.some((m) => m.url === action.payload.logoUrl);
          if (!exists) {
            const filename = action.payload.logoUrl.split("/").pop() || "logo";
            state.mediaList.unshift({
              _id: action.payload._id + "_logo",
              url: action.payload.logoUrl,
              filename,
              alt: action.payload.logoAlt || "",
              title: action.payload.logoTitle || "",
              createdAt: new Date().toISOString(),
            });
          }
        }
      })
      .addCase(updateGame.fulfilled, (state, action) => {
        if (action.payload?.logoUrl) {
          const exists = state.mediaList.some((m) => m.url === action.payload.logoUrl);
          if (!exists) {
            const filename = action.payload.logoUrl.split("/").pop() || "logo";
            state.mediaList.unshift({
              _id: action.payload._id + "_logo",
              url: action.payload.logoUrl,
              filename,
              alt: action.payload.logoAlt || "",
              title: action.payload.logoTitle || "",
              createdAt: new Date().toISOString(),
            });
          }
        }
      });
  },
});

export const { clearMediaError } = mediaSlice.actions;
export default mediaSlice.reducer;
