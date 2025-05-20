import { useAppStore } from "@/store";
import { useEffect, useRef } from "react";
import moment from "moment";
import apiClient from "@/lib/api-client.js";
import { GET_ALL_MESSAGES_ROUTE } from "@/utils/constants.js";
import { HOST } from "@/utils/constants.js";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { useState } from "react";
import { Avatar, AvatarImage,AvatarFallback } from "@radix-ui/react-avatar";
import { GET_CHANNEL_MESSAGES } from "@/utils/constants";
import { getColor } from "@/lib/utils";
import { FaPlay, FaPause, FaMicrophone } from "react-icons/fa";


const MessageContainer = () => {
  const scrollRef = useRef();
  const {
    selectedChatData,
    selectedChatType,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
    setFileDownloadProgress,
    setIsDownloading,
  } = useAppStore();
  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        if (response.data.messages)
          setSelectedChatMessages(response.data.messages);
      } catch (error) {
        console.log(error);
      }
    };
    const getChannelMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_CHANNEL_MESSAGES}/${selectedChatData._id}`,
          { withCredentials: true }
        );
        if (response.data.messages)
          setSelectedChatMessages(response.data.messages);
      } catch (error) {
        console.log(error);
      }
    };
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "channel") getChannelMessages();
    }
    console.log("channelId gönderilen:", selectedChatData._id);
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  const checkIfImage = (filePath) => {
    const imageRegex =
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|heif|heic|tif)$/i;
    return imageRegex.test(filePath);
  };

  const getAudioSrc = (fileUrl) => {
    if (!fileUrl) return "";
    const normalized = fileUrl.replace(/\\/g, "/").replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    return `${HOST}/${normalized}`;
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
          {selectedChatType === "channel" && renderChannelMessages(message)}
        </div>
      );
    });
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    const response = await apiClient.get(`${HOST}/${url}`, {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percent = Math.round((loaded * 100) / total);
        setFileDownloadProgress(percent);
      },
    });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };
  const renderDMMessages = (message) => {
    const isOwn =
      message.sender === userInfo.id ||
      (message.sender && message.sender._id === userInfo.id);
    return (
      <div className={isOwn ? "text-right" : "text-left"}>
        {message.messageType === "voice" && message.fileUrl && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] flex items-center gap-3"
                : "bg-fuchsia-500/10 border border-fuchsia-500/20 inline-block p-4 rounded-2xl my-1 max-w-[60%] flex items-center gap-3"
            }
          >
            <VoiceMessagePlayer src={getAudioSrc(message.fileUrl)} isOwn={isOwn} />
          </div>
        )}
        {message.messageType === "text" && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
                : "bg-fuchsia-500/20 text-fuchsia-50 border-fuchsia-500/30 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
            }
          >
            {message.content}
          </div>
        )}
        {message.messageType === "file" && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
                : "bg-fuchsia-500/20 text-fuchsia-50 border-fuchsia-500/30 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
            }
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={getAudioSrc(message.fileUrl)}
                  height={300}
                  width={300}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-white/90 text-3xl bg-white/10 rounded-full p-3">
                  <MdFolderZip />
                </span>
                <span className="text-white/90">
                  {message.fileUrl.split("/").pop()}
                </span>
                <span
                  className="bg-white/10 p-3 text-2xl rounded-full hover:bg-white/20 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileUrl)}
                >
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-gray-600">
          {moment(message.timestamp).format("LT")}
        </div>
      </div>
    );
  };

  const renderChannelMessages = (message) => {
    const isOwn =
      (message.sender && message.sender._id === userInfo.id) ||
      message.sender === userInfo.id;
    return (
      <div className={isOwn ? "text-right mt-5" : "text-left mt-5"}>
        {message.messageType === "voice" && message.fileUrl && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] flex items-center gap-3"
                : "bg-fuchsia-500/10 border border-fuchsia-500/20 inline-block p-4 rounded-2xl my-1 max-w-[60%] flex items-center gap-3"
            }
          >
            <VoiceMessagePlayer src={getAudioSrc(message.fileUrl)} isOwn={isOwn} />
          </div>
        )}
        {message.messageType === "text" && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
                : "bg-fuchsia-500/20 text-fuchsia-50 border-fuchsia-500/30 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
            }
          >
            {message.content}
          </div>
        )}
        {message.messageType === "file" && (
          <div
            className={
              isOwn
                ? "bg-white/10 text-white border-white/20 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
                : "bg-fuchsia-500/20 text-fuchsia-50 border-fuchsia-500/30 border inline-block p-4 rounded-2xl my-1 max-w-[60%] break-words shadow-lg backdrop-blur-sm"
            }
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={getAudioSrc(message.fileUrl)}
                  height={300}
                  width={300}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-white/90 text-3xl bg-white/10 rounded-full p-3">
                  <MdFolderZip />
                </span>
                <span className="text-white/90">
                  {message.fileUrl.split("/").pop()}
                </span>
                <span
                  className="bg-white/10 p-3 text-2xl rounded-full hover:bg-white/20 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileUrl)}
                >
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}
          </div>
        )}
        {message.sender._id !== userInfo.id ? (
          <div className="flex items-center justify-start gap-3 ">
            <Avatar className="h-8 w-8 md:h-8 md:w-8 rounded-full overflow-hidden">
              {message.sender.image && (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black"
                />
              )}
              <AvatarFallback
                className={`uppercase h-8 w-8 text-lg  flex items-center justify-center ${getColor(
                  message.sender.color
                )}`}
              >
                {message.sender.firstName
                  ? message.sender.firstName.split(" ").shift()
                  : message.sender.email.split(" ".shift())}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/60">{`${message.sender.firstName} ${message.sender.lastName}`}</span>
            <span className=" text-xs text-white/60">
              {" "}
              {moment(message.timestamp).format("LT")}
            </span>
          </div>
        ) : (
          <div className=" text-xs text-white/60 mt-1">
            {" "}
            {moment(message.timestamp).format("LT")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full custom-scrollbar">
      {renderMessages()}
      <div ref={scrollRef}></div>
      {showImage && (
        <div className="fixed z-[1000] inset-0 flex items-center justify-center backdrop-blur-lg flex-col">
          <div className="max-h-[90vh] max-w-[90vw] overflow-hidden">
            <img
              src={`${HOST}/${imageURL}`}
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => downloadFile(imageURL)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VoiceMessagePlayer = ({ src, isOwn }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, []);

  useEffect(() => {
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration !== Infinity) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec) || sec === Infinity) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-4 w-full py-2 px-3 bg-white rounded-lg shadow">
      <button
        onClick={togglePlay}
        className={`p-3 rounded-full shadow-md focus:outline-none transition-all duration-200 text-2xl ${
          isOwn
            ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            : "bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-700"
        }`}
      >
        {playing ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl" />}
      </button>
      <div className="flex items-center gap-3 flex-1">
        <FaMicrophone className={`text-2xl ${isOwn ? "text-fuchsia-300" : "text-fuchsia-500"}`} />
        <div className="flex items-center w-full gap-3">
          <div className="relative flex-1 h-3 w-35 bg-fuchsia-200 rounded-full overflow-hidden shadow-inner border border-fuchsia-300">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-200"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            ></div>
          </div>
          <span className="text-sm font-mono text-fuchsia-700 min-w-[50px] text-right">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
      <audio ref={audioRef} src={src} className="hidden" onLoadedMetadata={onLoadedMetadata} />
    </div>
  );
  
};

export default MessageContainer;
