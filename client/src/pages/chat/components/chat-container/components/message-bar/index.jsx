import { useRef, useState, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { RiEmojiStickerLine } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import { useAppStore } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import apiClient from "@/lib/api-client.js";
import { FaMicrophone, FaStop } from "react-icons/fa";

const MessageBar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const {
    selectedChatData,
    selectedChatType,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };
  const handleSendMessage = async () => {
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (selectedChatType === "channel"){
      socket.emit("send-channel-message",{
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        channelId: selectedChatData._id,
      })
    }
    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        setIsUploading(true);
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
          withCredentials: true,
          onUploadProgress: (data) => {
            setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
          },
        });

        if (response.status === 200 && response.data) {
          setIsUploading(false);
          if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.filePath,
            });
          } else if (selectedChatType === "channel"){
            socket.emit("send-channel-message",{
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: response.data.filePath,
              channelId: selectedChatData._id,
            })
          }
        }
      }
      console.log({ file });
    } catch (error) {
      setIsUploading(false);
      console.log(error);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioURL(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const uploadVoice = async () => {
    if (!audioBlob) return;
    const formData = new FormData();
    formData.append("voice", audioBlob, "voice-message.webm");
    const response = await apiClient.post(
      "/api/messages/upload-voice",
      formData,
      { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
    );
    if (response.data.fileUrl) {
      // Mesajı gönder
      if (selectedChatType === "contact") {
        socket.emit("sendMessage", {
          sender: userInfo.id,
          content: undefined,
          recipient: selectedChatData._id,
          messageType: "voice",
          fileUrl: response.data.fileUrl,
        });
      } else if (selectedChatType === "channel") {
        socket.emit("send-channel-message", {
          sender: userInfo.id,
          content: undefined,
          messageType: "voice",
          fileUrl: response.data.fileUrl,
          channelId: selectedChatData._id,
        });
      }
      setAudioURL(null);
      setAudioBlob(null);
    }
  };

  return (
    <div className="h-[12vh] bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 backdrop-blur-sm border-t border-white/10 flex justify-center items-center px-4 py-4">
      <div className="flex-1 flex bg-white/5 backdrop-blur-sm rounded-full items-center gap-4 px-6 py-3 w-full max-w-[90%]">
        <input
          type="text"
          className="flex-1 bg-transparent text-fuchsia-100 placeholder-fuchsia-300/40 p-4 focus:outline-none text-lg"
          placeholder="Mesajınızı yazın..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        {!recording && !audioURL && (
          <button
            className="text-fuchsia-200 hover:text-fuchsia-300 focus:border-none focus:outline-none duration-300 transition-all p-3"
            onClick={startRecording}
            title="Sesli mesaj kaydet"
          >
            <FaMicrophone className="text-2xl" />
          </button>
        )}
        {recording && (
          <button
            className="text-red-400 hover:text-red-600 focus:border-none focus:outline-none duration-300 transition-all p-3 animate-pulse"
            onClick={stopRecording}
            title="Kaydı durdur"
          >
            <FaStop className="text-2xl" />
          </button>
        )}
        {audioURL && (
          <div className="flex items-center gap-2">
            <audio src={audioURL} controls className="h-8" />
            <button
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded-lg"
              onClick={uploadVoice}
            >
              Gönder
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg"
              onClick={() => { setAudioURL(null); setAudioBlob(null); }}
            >
              İptal
            </button>
          </div>
        )}
        <button
          className="text-fuchsia-200 hover:text-fuchsia-300 focus:border-none focus:outline-none duration-300 transition-all p-3"
          onClick={handleAttachmentClick}
        >
          <GrAttachment className="text-2xl" />
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAttachmentChange}
        />
        <div className="relative">
          <button
            className="text-fuchsia-200 hover:text-fuchsia-300 focus:border-none focus:outline-none duration-300 transition-all p-3"
            onClick={() => setEmojiPickerOpen(true)}
          >
            <RiEmojiStickerLine className="text-2xl" />
          </button>
          <div className="absolute bottom-16 right-0" ref={emojiRef}>
            <EmojiPicker
              theme="dark"
              open={emojiPickerOpen}
              onEmojiClick={handleAddEmoji}
              autofocusSearch={false}
            />
          </div>
        </div>
      </div>
      <button
        className="h-16 w-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20 flex items-center justify-center focus:outline-none duration-300 transition-all ml-4"
        onClick={handleSendMessage}
      >
        <IoSend className="text-2xl" />
      </button>
    </div>
  );
};

export default MessageBar;
