import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  token?: string;
}

interface AuthState {
  admin: Admin | null;
  loading: boolean;
  error: string | null;
  signupSuccess: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  admin: null,
  loading: false,
  error: null,
  signupSuccess: false,
  isInitialized: false,
};

export const loginAdmin = createAsyncThunk(
  "auth/login",
  async (creds: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post("/login", creds);
      return res.data.data as Admin;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const signupAdmin = createAsyncThunk(
  "auth/signup",
  async (
    data: { name: string; email: string; password: string; role?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/signup", data);
      return res.data.data as Admin;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Signup failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initializeAuth(state) {
      if (typeof window !== "undefined") {
        try {
          const s = localStorage.getItem("admin");
          state.admin = s ? JSON.parse(s) : null;
        } catch {
          state.admin = null;
        }
      }
      state.isInitialized = true;
    },
    logout(state) {
      state.admin = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin");
      }
    },
    clearError(state) {
      state.error = null;
    },
    clearSignupSuccess(state) {
      state.signupSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload;
        if (typeof window !== "undefined") {
          localStorage.setItem("admin", JSON.stringify(action.payload));
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Signup
    builder
      .addCase(signupAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
      })
      .addCase(signupAdmin.fulfilled, (state) => {
        state.loading = false;
        state.signupSuccess = true;
      })
      .addCase(signupAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, clearSignupSuccess, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
