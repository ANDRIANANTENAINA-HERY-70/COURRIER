import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// État initial
const initialState = {
    courriers: [],
    stats: null,
    total: 0,
    currentPage: 1,
    perPage: 15,
    isLoading: false,
    error: null
};

// Actions asynchrones
export const fetchCourriers = createAsyncThunk(
    'courriers/fetchCourriers',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/courriers', { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement');
        }
    }
);

export const fetchCourrierStats = createAsyncThunk(
    'courriers/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/courriers/stats/global');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des stats');
        }
    }
);

export const createCourrier = createAsyncThunk(
    'courriers/createCourrier',
    async (courrierData, { rejectWithValue }) => {
        try {
            const response = await api.post('/courriers', courrierData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
        }
    }
);

export const updateCourrier = createAsyncThunk(
    'courriers/updateCourrier',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/courriers/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la modification');
        }
    }
);

export const deleteCourrier = createAsyncThunk(
    'courriers/deleteCourrier',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/courriers/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    }
);

// Slice
const courrierSlice = createSlice({
    name: 'courriers',
    initialState,
    reducers: {
        setPage: (state, action) => {
            state.currentPage = action.payload;
        },
        clearCourrierError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch courriers
            .addCase(fetchCourriers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCourriers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.courriers = action.payload.data || action.payload;
                state.total = action.payload.total || action.payload.length;
            })
            .addCase(fetchCourriers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch stats
            .addCase(fetchCourrierStats.fulfilled, (state, action) => {
                state.stats = action.payload;
            })
            // Create courrier
            .addCase(createCourrier.fulfilled, (state, action) => {
                state.courriers.unshift(action.payload.courrier || action.payload);
            })
            // Update courrier
            .addCase(updateCourrier.fulfilled, (state, action) => {
                const updatedCourrier = action.payload.courrier || action.payload;
                const index = state.courriers.findIndex(c => c.id === updatedCourrier.id);
                if (index !== -1) {
                    state.courriers[index] = updatedCourrier;
                }
            })
            // Delete courrier
            .addCase(deleteCourrier.fulfilled, (state, action) => {
                state.courriers = state.courriers.filter(c => c.id !== action.payload);
            });
    }
});

export const { setPage, clearCourrierError } = courrierSlice.actions;
export default courrierSlice.reducer;