import { configureStore } from '@reduxjs/toolkit'
import positionReducer from './positionSlice'

export default configureStore({
  reducer: {
    position: positionReducer,
  },
})