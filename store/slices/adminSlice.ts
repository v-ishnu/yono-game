import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminState {
  admins: AdminUser[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  admins: [],
  loading: false,
  error: null,
};

export const fetchAdmins = createAsyncThunk(
  "admins/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/list");
      return res.data.data as AdminUser[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch admins");
    }
  }
);

export const removeAdmin = createAsyncThunk(
  "admins/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete admin");
    }
  }
);

const adminSlice = createSlice({
  name: "admins",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(removeAdmin.pending, (state) => { state.loading = true; })
      .addCase(removeAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = state.admins.filter((a) => a._id !== action.payload);
      })
      .addCase(removeAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
