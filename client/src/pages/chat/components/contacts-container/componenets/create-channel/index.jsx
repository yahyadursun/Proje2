import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import apiClient from "@/lib/api-client.js";
import { useAppStore } from "@/store";
import { useEffect } from "react";
import {
  CREATE_CHANNEL_ROUTES,
  GET_ALL_CONTACTS_ROUTES,
} from "@/utils/constants";
import MultipleSelector from "@/components/ui/multipleselect";

const CreateChannel = () => {
  const { setSelectedChatType, setSelectedChatData, addChannel } =
    useAppStore();
  const [newChannelModal, setNewChannelModal] = useState(false);

  const [allConstacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelImage, setChannelImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getData = async () => {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      setAllContacts(response.data.contacts);
    };
    getData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setChannelImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const createChannel = async () => {
    setError("");
    if (!channelName.trim()) {
      setError("Kanal ismi zorunlu!");
      return;
    }
    if (selectedContacts.length === 0) {
      setError("En az bir üye seçmelisiniz!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", channelName);
      formData.append("members", JSON.stringify(selectedContacts.map((contact) => contact.value)));
      formData.append("description", channelDescription);
      if (channelImage) {
        formData.append("image", channelImage);
      }
      const response = await apiClient.post(
        CREATE_CHANNEL_ROUTES,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 201) {
        setChannelName("");
        setChannelDescription("");
        setSelectedContacts([]);
        setChannelImage(null);
        setPreviewImage(null);
        setNewChannelModal(false);
        addChannel(response.data.channel);
      }
    } catch (error) {
      setError("Kanal oluşturulamadı. Lütfen tekrar deneyin.");
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300 text-2xl"
              onClick={() => setNewChannelModal(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
            Yeni Kanal Oluştur
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={newChannelModal} onOpenChange={setNewChannelModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[420px] max-w-full flex flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-400 mb-1">Kanal Oluştur</DialogTitle>
            <DialogDescription className="text-fuchsia-200/80 mb-2">Kanal bilgilerini doldurun ve üyeleri seçin.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Kanal İsmi *"
              className="rounded-xl p-4 bg-[#2c2e3b] border-none text-lg focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setChannelName(e.target.value)}
              value={channelName}
              maxLength={40}
            />
            <Textarea
              placeholder="Kanal Açıklaması (isteğe bağlı)"
              className="rounded-xl p-3 bg-[#2c2e3b] border-none text-base focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setChannelDescription(e.target.value)}
              value={channelDescription}
              rows={2}
              maxLength={120}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Kanal Görseli</label>
              <input
                type="file"
                accept="image/*"
                className="rounded-lg p-2 bg-[#2c2e3b] border-none text-white"
                onChange={handleImageChange}
              />
              {previewImage && (
                <img src={previewImage} alt="preview" className="w-20 h-20 object-cover rounded-xl border-2 border-purple-600 mt-2 mx-auto" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Üyeler *</label>
              <MultipleSelector
                className="rounded-xl bg-[#2c2e3b] border-none py-2 text-white"
                defaultOptions={allConstacts}
                placeholder="Kişi Ara ve Ekle"
                value={selectedContacts}
                onChange={setSelectedContacts}
                emptyIndicator={<p className="text-center text-lg leading-10 text-gray-600">Sonuç bulunamadı.</p>}
              />
            </div>
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            <button
              className="w-full mt-2 bg-gradient-to-r from-fuchsia-500 to-purple-700 hover:from-fuchsia-600 hover:to-purple-800 p-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-fuchsia-500/10"
              onClick={createChannel}
            >
              Kanalı Oluştur
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateChannel;
