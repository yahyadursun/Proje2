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

  useEffect(() => {
    const getData = async () => {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      setAllContacts(response.data.contacts);
    };
    getData();
  }, []);

  const createChannel = async () => {
    try {
      if (channelName.length > 0 && selectedContacts.length > 0) {
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
          setNewChannelModal(false);
          addChannel(response.data.channel);
        }
      }
    } catch (error) {
      console.log({ error });
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-start hover :text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => setNewChannelModal(true)}
            ></FaPlus>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
            Yeni Kanal Oluştur
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={newChannelModal} onOpenChange={setNewChannelModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[auto] flex flex-col">
          <DialogHeader>
            <DialogTitle>Kanal Detaylarını Giriniz</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="mb-2">
            <Input
              placeholder="Kanal İsmi"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={(e) => setChannelName(e.target.value)}
              value={channelName}
            />
          </div>
          <div className="mb-2">
            <Textarea
              placeholder="Kanal Açıklaması (isteğe bağlı)"
              className="rounded-lg p-3 bg-[#2c2e3b] border-none"
              onChange={(e) => setChannelDescription(e.target.value)}
              value={channelDescription}
              rows={2}
            />
          </div>
          <div className="mb-2">
            <input
              type="file"
              accept="image/*"
              className="rounded-lg p-2 bg-[#2c2e3b] border-none text-white"
              onChange={e => setChannelImage(e.target.files[0])}
            />
            <MultipleSelector
              className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
              defaultOptions={allConstacts}
              placeholder="Kişi Ara"
              value={selectedContacts}
              onChange={setSelectedContacts}
              emptyIndicator={
                <p className="text-center text-lg leading-10 text-gray-600">
                  Sonuc bulunamadı.
                </p>
              }
            />
          </div>
          <div>
            <button
              className="wfull bg-purple-700 hover:bg-purple-900 p-2 transtion-all duration-300"
              onClick={createChannel}
            >
              Create Channel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateChannel;
