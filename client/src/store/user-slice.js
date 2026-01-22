import { createSlice } from "@reduxjs/toolkit";


 const   initialState = {currentUser:  null || JSON.parse(localStorage.getItem("currentUser")),
    socket: null, onlineUsers:[]}



const userSlice = createSlice({
    name:"user",
    initialState,
        
    reducers: {
        changeCurrentUser:(state, action)=>{
            state.currentUser = action.payload;
        },
        setSsocket: (state, action)=>{
            state.socket =  action.payload;
        },
        setOnlineUser: (state, action)=>{
            state.onlineUsers = action.payload;
        }
    }
})

export const userActions = userSlice.actions;

export default userSlice;