import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constants.js";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MultipleSelector from "@/components/ui/multipleselect";
import Textarea from "@/components/ui/textarea";
import apiClient from "@/lib/api-client";
import { GET_ALL_CONTACTS_ROUTES, CREATE_CHANNEL_ROUTES } from "@/utils/constants";

const ChatHeader = () => {
  const { userInfo, closeChat, selectedChatData, selectedChatType, setSelectedChatData, setChannels, channels } = useAppStore();
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMembers, setEditMembers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editImage, setEditImage] = useState(null);

  // Edit mode'a geçerken mevcut verileri doldur
  const startEdit = () => {
    setEditName(selectedChatData.name);
    setEditDescription(selectedChatData.description || "");
    setEditMembers(selectedChatData.members.map(m => ({ label: m.firstName ? `${m.firstName} ${m.lastName}` : m.email, value: m._id })));
    setEditImage(null);
    setEditMode(true);
  };

  // Tüm kişileri çek
  const fetchContacts = async () => {
    const response = await apiClient.get("/api/contacts/get-all-users", { withCredentials: true });
    setAllContacts(response.data.users.map(c => ({ label: c.firstName ? `${c.firstName} ${c.lastName}` : c.email, value: c._id })));
  };

  // Modal açıldığında kişileri çek
  React.useEffect(() => {
    if (openInfoModal) fetchContacts();
  }, [openInfoModal]);

  // Kanalı güncelle
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("description", editDescription);
      formData.append("members", JSON.stringify(editMembers.map(m => m.value)));
      if (editImage) {
        formData.append("image", editImage);
      }
      const response = await apiClient.patch(
        `/api/channel/update-channel/${selectedChatData._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 200) {
        setSelectedChatData(response.data.channel);
        // Kanal listesinde de güncelle
        const updatedChannels = channels.map(c => c._id === response.data.channel._id ? response.data.channel : c);
        setChannels(updatedChannels);
        setEditMode(false);
      }
    } catch (error) {
      alert("Kanal güncellenemedi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-20">
      <div className="flex gap-5 items-center w-full justify-between">
        <div className="flex gap-3 items-center justify-center">
          <div className="w-12 h-12 relative">
            {selectedChatType === "contact" ? (
              <Avatar className="h-12 w-12 md:h-48 md:w-48 rounded-full overflow-hidden">
                {selectedChatData.image ? (
                  <AvatarImage
                    src={`${HOST}/${selectedChatData.image}`}
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : null}
                <AvatarFallback className={`uppercase h-12 w-12 text-lg flex items-center justify-center ${getColor(selectedChatData.color)} bg-purple-700 text-white`}>
                  {selectedChatData.firstName && selectedChatData.firstName.trim() !== ""
                    ? selectedChatData.firstName.split(" ").shift()
                    : selectedChatData.email && selectedChatData.email.trim() !== ""
                    ? selectedChatData.email.split(" ").shift()
                    : ""}
                </AvatarFallback>
              </Avatar>
            ) : selectedChatType === "channel" ? (
              <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                {selectedChatData.image && (
                  <AvatarImage
                    src={`${HOST}/${selectedChatData.image}`}
                    alt="kanal-avatar"
                    className="object-cover w-full h-full"
                  />
                )}
                <AvatarFallback className="uppercase h-12 w-12 text-lg flex items-center justify-center bg-purple-700 text-white">
                  {selectedChatData.name && selectedChatData.name.trim() !== ""
                    ? selectedChatData.name.charAt(0)
                    : "#"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full "></div>
            )}
          </div>
          <div>
            {selectedChatType === "channel" && (
              <>
                <div>
                  <button
                    className="text-lg font-semibold hover:underline hover:text-purple-400 transition-all"
                    onClick={() => setOpenInfoModal(true)}
                  >
                    {selectedChatData.name}
                  </button>
                </div>
                {/* Kanal Bilgileri Modalı */}
                <Dialog open={openInfoModal} onOpenChange={setOpenInfoModal}>
                  <DialogContent className="bg-[#181920] border-none text-white w-[400px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Kanal Bilgileri</DialogTitle>
                      <DialogDescription>
                        Kanal üyeleri ve admin bilgileri aşağıda listelenmiştir.
                      </DialogDescription>
                      <div>
                        {/* Kanal resmi veya baş harfli avatar */}
                        <div className="flex justify-center mb-4">
                          <Avatar className="h-24 w-24 rounded-full overflow-hidden">
                            {selectedChatData.image && (
                              <AvatarImage
                                src={`${HOST}/${selectedChatData.image}`}
                                alt="kanal-avatar"
                                className="object-cover w-full h-full"
                              />
                            )}
                            <AvatarFallback className="uppercase h-24 w-24 text-4xl flex items-center justify-center bg-purple-700 text-white">
                              {selectedChatData.name && selectedChatData.name.trim() !== ""
                                ? selectedChatData.name.charAt(0)
                                : "#"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="mb-2 text-lg font-bold">{selectedChatData.name}</div>
                        {selectedChatData.description && (
                          <div className="mb-2 text-sm text-gray-300">{selectedChatData.description}</div>
                        )}
                        {/* Admin ise düzenle butonu */}
                        {userInfo && selectedChatData.admin && userInfo.id === selectedChatData.admin._id && !editMode && (
                          <button className="bg-purple-700 hover:bg-purple-900 text-white px-3 py-1 rounded mb-3" onClick={startEdit}>
                            Düzenle
                          </button>
                        )}
                        {/* Düzenleme Formu */}
                        {editMode && (
                          <div className="flex flex-col gap-3 mb-3">
                            <input
                              className="rounded-lg p-2 bg-[#2c2e3b] border-none text-white"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Kanal Adı"
                            />
                            <Textarea
                              className="rounded-lg p-2 bg-[#2c2e3b] border-none text-white"
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              placeholder="Kanal Açıklaması"
                              rows={2}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="rounded-lg p-2 bg-[#2c2e3b] border-none text-white"
                              onChange={e => setEditImage(e.target.files[0])}
                            />
                            <MultipleSelector
                              className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
                              defaultOptions={allContacts}
                              value={editMembers}
                              onChange={setEditMembers}
                              placeholder="Kişi Ekle/Çıkar"
                              emptyIndicator={<p className="text-center text-lg leading-10 text-gray-600">Sonuç bulunamadı.</p>}
                            />
                            <div className="flex gap-2 mt-2">
                              <button className="bg-green-600 hover:bg-green-800 px-3 py-1 rounded text-white" onClick={handleUpdate} disabled={loading}>
                                Kaydet
                              </button>
                              <button className="bg-gray-600 hover:bg-gray-800 px-3 py-1 rounded text-white" onClick={() => setEditMode(false)}>
                                İptal
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="mb-2 text-sm text-purple-300">Admin:</div>
                        {selectedChatData.admin && (
                          <div className="flex items-center gap-2 mb-4">
                            <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                              {selectedChatData.admin.image ? (
                                <AvatarImage
                                  src={`${HOST}/${selectedChatData.admin.image}`}
                                  alt="profile"
                                  className="object-cover w-full h-full bg-black"
                                />
                              ) : (
                                <div className={`uppercase h-10 w-10 text-base flex items-center justify-center ${getColor(selectedChatData.admin.color)}`}>
                                  {selectedChatData.admin.firstName
                                    ? selectedChatData.admin.firstName.charAt(0)
                                    : selectedChatData.admin.email.charAt(0)}
                                </div>
                              )}
                            </Avatar>
                            <span className="text-base font-semibold text-purple-300">{selectedChatData.admin.firstName ? `${selectedChatData.admin.firstName} ${selectedChatData.admin.lastName}` : selectedChatData.admin.email}</span>
                          </div>
                        )}
                        <div className="mb-2 text-sm text-white">Üyeler:</div>
                        <div className="flex flex-col gap-2">
                          {selectedChatData.members && selectedChatData.members.filter(m => m._id !== selectedChatData.admin._id).map((member) => (
                            <div key={member._id} className="flex items-center gap-2 px-2 py-1 rounded bg-white/10">
                              <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                {member.image ? (
                                  <AvatarImage
                                    src={`${HOST}/${member.image}`}
                                    alt="profile"
                                    className="object-cover w-full h-full bg-black"
                                  />
                                ) : (
                                  <div className={`uppercase h-8 w-8 text-xs flex items-center justify-center ${getColor(member.color)}`}>
                                    {member.firstName
                                      ? member.firstName.charAt(0)
                                      : member.email.charAt(0)}
                                  </div>
                                )}
                              </Avatar>
                              <span className="text-sm">{member.firstName ? `${member.firstName} ${member.lastName}` : member.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {selectedChatType === "contact" && selectedChatData.firstName
              ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
              : selectedChatData.email}
          </div>
        </div>
        <div className="flex items-center justify-center gap-5">
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
            onClick={closeChat}
          >
            <RiCloseFill className="text-3xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
