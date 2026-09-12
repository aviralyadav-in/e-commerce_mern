import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/admin");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

// 🆕 Fetch User by ID (full profile + saved addresses)
export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/admin/${id}`);
      return response.data; // { user, addresses }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details",
      );
    }
  },
);

export const addUser = createAsyncThunk(
  "users/addUser",
  async (userData, { rejectWithValue }) => {
    try {
      // FormData (photo ke saath create) ya JSON — dono support
      const response = await API.post(
        "/users/admin",
        userData,
        userData instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/users/admin/${id}`, data);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await API.delete(`/users/admin/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

// 🆕 Customer avatar upload / remove (Users drawer se)
export const uploadUserAvatar = createAsyncThunk(
  "users/uploadAvatar",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/users/admin/${id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Avatar upload failed",
      );
    }
  },
);

export const removeUserAvatar = createAsyncThunk(
  "users/removeAvatar",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/users/admin/${id}/avatar`);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not remove photo",
      );
    }
  },
);

// 🆕 Bulk Create Users / Customers (CSV Upload)
export const bulkCreateUsers = createAsyncThunk(
  "users/bulkCreate",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/admin/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to bulk upload customers",
      );
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    selectedUser: null,
    selectedUserAddresses: [],
    detailLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.selectedUserAddresses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk Create
      .addCase(bulkCreateUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateUsers.fulfilled, (state, action) => {
        state.loading = false;
        const newUsers = action.payload?.users || [];
        if (newUsers.length > 0) {
          state.users.unshift(...newUsers);
        }
      })
      .addCase(bulkCreateUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (u) => u._id === action.payload._id,
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?._id === action.payload?._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((u) => u._id !== action.payload);
        if (state.selectedUser?._id === action.payload) {
          state.selectedUser = null;
          state.selectedUserAddresses = [];
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🆕 Avatar thunks — list me updated user replace karo aur selectedUser sync rakho
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (u) => u._id === action.payload._id,
        );
        if (index !== -1) state.users[index] = action.payload;
        if (state.selectedUser?._id === action.payload?._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(removeUserAvatar.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (u) => u._id === action.payload._id,
        );
        if (index !== -1) state.users[index] = action.payload;
        if (state.selectedUser?._id === action.payload?._id) {
          state.selectedUser = action.payload;
        }
      })

      // 🆕 Fetch User by ID (with addresses)
      .addCase(fetchUserById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedUser = action.payload.user;
        state.selectedUserAddresses = action.payload.addresses || [];
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError, clearSelectedUser } = usersSlice.actions;
export default usersSlice.reducer;
