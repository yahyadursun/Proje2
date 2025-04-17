import { useEffect } from "react";
import { useAppStore } from "../../store";

const Chat = () => {
const {userInfo} = useAppStore();
const navigate = useNavigate();
useEffect(() => {
  if(!userInfo.profileSetup) { 
    toast("Please setup  profile continue.");
    navigate("/profile");
  }
   

}, [userInfo,navigate] );
  return (
    <div>
      Chat
    </div>
  )
};

export default Chat;
