import { useEffect, useState, useRef } from "react";
import { useAppStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import apiClient from "../../lib/api-client";
import { ADD_PROFILE_IMAGE_ROUTE, REMOVE_PROFILE_IMAGE_ROUTE } from "../../utils/constants";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { colors, getColor } from "../../lib/utils";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { toast, Toaster } from "sonner";
import { UPDATE_PROFILE_ROUTE } from "../../utils/constants";
import { HOST } from "@/utils/constants";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (userInfo?.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
    }
    if(userInfo?.image){
      setImage(`${HOST}/${userInfo.image}`)
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First Name reqired!");
      return false;
    }
    if (!lastName) {
      toast.error("Last Name reqired!");
      return false;
    }
    return true;
  };
  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(
          UPDATE_PROFILE_ROUTE,
          { firstName, lastName, color: selectedColor },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data) {
          toast.success("Profile updated successfully. Please login again.");
          setUserInfo(null);
          navigate("/");
        }
      } catch (error) {}
    }
  };
  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please setup your profile.");
    }
  };
  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    console.log({ file });
    if (file) {
      const formData = new FormData();
      formData.append("profile-image", file);
      const response = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData, {
        withCredentials: true,
      });
      if (response.status == 200 && response.data.image) {
        setUserInfo({ ...userInfo, image: response.data.image });
        toast.success("Image updated succesfully");
      }
    }
  };
  const handleDeleteImage = async () => {
    try {
      const response= await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE,{
        withCredentials:true,
      });
      if (response.status === 200){
        setUserInfo({...userInfo,image:null});
        toast.success("Image removed successfully.");
        setImage(null);
      }
    } catch (error) {
      console.log(error)
      
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 flex items-center justify-center px-4 py-10">
      {!userInfo ? (
        <div className="text-fuchsia-200 text-xl">Loading...</div>
      ) : (
        <div className="flex flex-col gap-10 w-full max-w-4xl">
          <div onClick={handleNavigate} className="hover:scale-110 transition-transform duration-300">
            <IoArrowBack className="text-4xl lg:text-5xl text-fuchsia-200 cursor-pointer" />
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl">
            {/* Avatar & Image Upload Area */}
            <div
              className="relative flex items-center justify-center"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Avatar className="h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden shadow-lg shadow-fuchsia-500/20">
                {image ? (
                  <AvatarImage
                    src={image}
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`uppercase text-5xl md:text-6xl w-full h-full flex items-center justify-center ${getColor(
                      selectedColor
                    )}`}
                  >
                    {firstName
                      ? firstName[0]
                      : userInfo?.email?.[0] || '?'}
                  </div>
                )}
              </Avatar>
  
              {hovered && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-black/60"
                  onClick={image ? handleDeleteImage : handleFileInputClick}
                >
                  {image ? (
                    <FaTrash className="text-white text-3xl hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <FaPlus className="text-white text-3xl hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
              )}
  
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleImageChange}
                name="profile-image"
                accept=".png, .jpeg, .jpg, .svg, .webp"
              />
            </div>
  
            {/* Form Area */}
            <div className="flex flex-col gap-4 text-white justify-center">
              <Input
                placeholder="Email"
                type="email"
                disabled
                value={userInfo.email}
                className="rounded-full px-5 py-4 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40"
              />
              <Input
                placeholder="First Name"
                type="text"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                className="rounded-full px-5 py-4 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40"
              />
              <Input
                placeholder="Last Name"
                type="text"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
                className="rounded-full px-5 py-4 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40"
              />
    
              {/* Color Options */}
              <div className="flex gap-3 mt-2">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`h-8 w-8 rounded-full cursor-pointer transition-all duration-300 ${color} ${
                      selectedColor === index ? "outline outline-fuchsia-500/60 shadow-lg shadow-fuchsia-500/20 scale-110" : ""
                    } hover:scale-110`}
                    onClick={() => setSelectedColor(index)}
                  />
                ))}
              </div>

              <Button
                onClick={saveChanges}
                className="mt-4 rounded-full p-6 cursor-pointer bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default Profile;
