import { createSlice } from '@reduxjs/toolkit'

export const positionSlice = createSlice({
  name: 'position',
  initialState: {
    value: 0.0,
  },
  reducers: {
   change: (state, action) => {
      state.value = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const { change } = positionSlice.actions

export default positionSlice.reducer