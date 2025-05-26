import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useAppStore } from "@/store";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constants";
import { FiEdit2 } from "react-icons/fi";
import { IoPowerSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { LOGOUT_ROUTE } from "../../../../../../utils/constants";
import apiClient from "@/lib/api-client.js";

const ProfileInfo = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const navigate = useNavigate();

  const logOut = async () => {
    try {
      const response = await apiClient.post(
        LOGOUT_ROUTE,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        navigate("/auth");
        setUserInfo(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full h-12 flex items-center justify-between px-6 bg-[#1b1c2]">
      {/* Avatar & İsim */}
      <div className="flex gap-3 items-center">
        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
          {userInfo.image ? (
            <AvatarImage
              src={`${HOST}/${userInfo.image}`}
              alt="profile"
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className={`uppercase h-12 w-12 flex items-center justify-center ${getColor(
                userInfo.color
              )}`}
            >
              {(userInfo.firstName?.trim()
                ? userInfo.firstName.split(" ").shift()
                : userInfo.email?.trim()
                ? userInfo.email.split(" ").shift()
                : ""
              )}
            </div>
          )}
        </Avatar>
        <span className="text-white font-medium text-sm">
          {userInfo.firstName && userInfo.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : userInfo.email}
        </span>
      </div>

      {/* Düzenle & Çıkış */}
      <div className="flex gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate("/profile")}>
                <FiEdit2 className="text-purple-500 text-xl cursor-pointer" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Profil düzenle</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={logOut}>
                <IoPowerSharp className="text-red-500 text-xl cursor-pointer" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Çıkış</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ProfileInfo;
