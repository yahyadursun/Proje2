import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from 'react-toastify';
import { useAppStore } from "../../store";
import ContactsContainer from "./components/contacts-container";
import EmptyChatContainer from "./components/empty-chat-container";
import ChatContainer from "./components/chat-container";

const Chat = () => {
const {userInfo} = useAppStore();
const navigate= useNavigate();
useEffect(() => {
  if(!userInfo.profileSetup) { 
    toast("Please setup  profile continue.");
    navigate("/profile");
  }
   

}, [userInfo,navigate] );
  return (
    <div className="flex h-[100vh] text-white overflow-hidden">
      <ContactsContainer/>
      {/* <EmptyChatContainer/> */}
      <ChatContainer/>
    </div>
  )
};

export default Chat;
