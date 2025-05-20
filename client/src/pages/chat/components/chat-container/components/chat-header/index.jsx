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
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [channelImageError, setChannelImageError] = useState(false);
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);

  // Resim değiştiğinde önizleme oluştur
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEditImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  // Edit mode'a geçerken mevcut verileri doldur
  const startEdit = () => {
    setEditName(selectedChatData.name);
    setEditDescription(selectedChatData.description || "");
    setEditMembers(selectedChatData.members.map(m => ({ label: m.firstName ? `${m.firstName} ${m.lastName}` : m.email, value: m._id })));
    setEditImage(null);
    setPreviewImage(null);
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

  // Profil resmi değiştiğinde imageError'ı sıfırla
  React.useEffect(() => {
    setImageError(false);
    setChannelImageError(false);
  }, [selectedChatData.image]);

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
        <div>
          {selectedChatType === "channel" && (
            <>
              <div
                className="flex items-center gap-3 group cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                onClick={() => setOpenInfoModal(true)}
              >
                <Avatar
                  key={selectedChatData._id || selectedChatData.name}
                  className="h-10 w-10 rounded-full overflow-hidden border-2 border-purple-600 group-hover:scale-105 transition-transform"
                >
                  {selectedChatData.image && !channelImageError && (
                    <AvatarImage
                      src={`${HOST}/${selectedChatData.image}`}
                      alt="kanal-avatar"
                      className="object-cover w-full h-full"
                      onError={() => setChannelImageError(true)}
                    />
                  )}
                  <AvatarFallback className="uppercase h-10 w-10 text-lg flex items-center justify-center bg-purple-700 text-white">
                    {selectedChatData.name && selectedChatData.name.trim() !== ""
                      ? selectedChatData.name.charAt(0)
                      : "#"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-lg font-bold group-hover:text-purple-400 transition-colors">
                    {selectedChatData.name}
                  </span>
                  {selectedChatData.description && (
                    <span className="text-xs text-purple-200/80 max-w-[200px] truncate">
                      {selectedChatData.description}
                    </span>
                  )}
                </div>
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
                      <div className="flex justify-center mb-6">
                        <Avatar
                          key={selectedChatData._id || selectedChatData.name}
                          className="h-24 w-24 rounded-full overflow-hidden border-2 border-purple-600"
                        >
                          {(previewImage || (selectedChatData.image && !channelImageError)) && (
                            <AvatarImage
                              src={previewImage || `${HOST}/${selectedChatData.image}`}
                              alt="kanal-avatar"
                              className="object-cover w-full h-full"
                              onError={() => setChannelImageError(true)}
                            />
                          )}
                          <AvatarFallback className="uppercase h-24 w-24 text-4xl flex items-center justify-center bg-purple-700 text-white">
                            {selectedChatData.name && selectedChatData.name.trim() !== ""
                              ? selectedChatData.name.charAt(0)
                              : "#"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {!editMode ? (
                        <>
                          <div className="mb-4 text-center">
                            <h3 className="text-xl font-bold mb-2">{selectedChatData.name}</h3>
                            {selectedChatData.description && (
                              <p className="text-sm text-gray-400">{selectedChatData.description}</p>
                            )}
                          </div>
                          {/* Admin ise düzenle butonu */}
                          {userInfo && selectedChatData.admin && userInfo.id === selectedChatData.admin._id && (
                            <div className="flex justify-center mb-4">
                              <button 
                                className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                onClick={startEdit}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-4 mb-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Kanal Adı</label>
                            <input
                              className="w-full rounded-lg p-2 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-purple-500"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Kanal Adı"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Açıklama</label>
                            <Textarea
                              className="w-full rounded-lg p-2 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-purple-500"
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              placeholder="Kanal Açıklaması"
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Kanal Görseli</label>
                            <input
                              type="file"
                              accept="image/*"
                              className="w-full rounded-lg p-2 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-purple-500"
                              onChange={handleImageChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Üyeler</label>
                            <MultipleSelector
                              className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
                              defaultOptions={allContacts}
                              value={editMembers}
                              onChange={setEditMembers}
                              placeholder="Kişi Ekle/Çıkar"
                              emptyIndicator={<p className="text-center text-lg leading-10 text-gray-600">Sonuç bulunamadı.</p>}
                            />
                          </div>
                          
                          <div className="flex gap-3 justify-end mt-2">
                            <button 
                              className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
                              onClick={() => {
                                setEditMode(false);
                                setPreviewImage(null);
                              }}
                            >
                              İptal
                            </button>
                            <button 
                              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200 flex items-center gap-2"
                              onClick={handleUpdate}
                              disabled={loading}
                            >
                              {loading ? (
                                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                              ) : null}
                              Kaydet
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-purple-400 mb-3">Admin</h4>
                        {selectedChatData.admin && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#2c2e3b]">
                            <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                              {selectedChatData.admin.image ? (
                                <AvatarImage
                                  src={`${HOST}/${selectedChatData.admin.image}`}
                                  alt="profile"
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <AvatarFallback className={`uppercase h-10 w-10 text-base flex items-center justify-center ${getColor(selectedChatData.admin.color)}`}>
                                  {selectedChatData.admin.firstName
                                    ? selectedChatData.admin.firstName.charAt(0)
                                    : selectedChatData.admin.email.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {selectedChatData.admin.firstName 
                                  ? `${selectedChatData.admin.firstName} ${selectedChatData.admin.lastName}` 
                                  : selectedChatData.admin.email}
                              </div>
                              <div className="text-sm text-gray-400">Admin</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-purple-400 mb-3">Üyeler</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {selectedChatData.members && selectedChatData.members
                            .filter(m => m._id !== selectedChatData.admin._id)
                            .map((member) => (
                              <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg bg-[#2c2e3b] hover:bg-[#363847] transition-colors duration-200">
                                <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                  {member.image ? (
                                    <AvatarImage
                                      src={`${HOST}/${member.image}`}
                                      alt="profile"
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <AvatarFallback className={`uppercase h-8 w-8 text-xs flex items-center justify-center ${getColor(member.color)}`}>
                                      {member.firstName
                                        ? member.firstName.charAt(0)
                                        : member.email.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {member.firstName ? `${member.firstName} ${member.lastName}` : member.email}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </>
          )}
          {selectedChatType === "contact" && (
            <>
              <div
                className="flex items-center gap-3 group cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                onClick={() => setOpenUserInfoModal(true)}
              >
                <Avatar
                  key={selectedChatData._id || selectedChatData.email}
                  className="h-10 w-10 rounded-full overflow-hidden border-2 border-fuchsia-500 group-hover:scale-105 transition-transform"
                >
                  {selectedChatData.image && !imageError && (
                    <AvatarImage
                      src={`${HOST}/${selectedChatData.image}`}
                      alt="profile"
                      className="object-cover w-full h-full"
                      onError={() => setImageError(true)}
                    />
                  )}
                  <AvatarFallback className={`uppercase h-10 w-10 text-lg flex items-center justify-center ${getColor(selectedChatData.color)}`}> 
                    {selectedChatData.firstName && selectedChatData.firstName.trim() !== ""
                      ? selectedChatData.firstName.charAt(0)
                      : selectedChatData.email && selectedChatData.email.trim() !== ""
                      ? selectedChatData.email.charAt(0)
                      : ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-lg font-bold group-hover:text-fuchsia-400 transition-colors">
                    {selectedChatData.firstName
                      ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                      : selectedChatData.email}
                  </span>
                  <span className="text-xs text-fuchsia-200/80">
                    {selectedChatData.email}
                  </span>
                </div>
              </div>
              {/* Kullanıcı Bilgileri Modalı */}
              <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
                <DialogContent className="bg-[#181920] border-none text-white w-[350px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Kullanıcı Bilgileri</DialogTitle>
                    <DialogDescription>
                      Kullanıcıya ait profil bilgileri aşağıda listelenmiştir.
                    </DialogDescription>
                    <div className="flex flex-col items-center gap-4 mt-4">
                      <Avatar className="h-24 w-24 rounded-full overflow-hidden border-2 border-fuchsia-500">
                        {selectedChatData.image && !imageError && (
                          <AvatarImage
                            src={`${HOST}/${selectedChatData.image}`}
                            alt="profile"
                            className="object-cover w-full h-full"
                            onError={() => setImageError(true)}
                          />
                        )}
                        <AvatarFallback className={`uppercase h-24 w-24 text-4xl flex items-center justify-center ${getColor(selectedChatData.color)}`}>
                          {selectedChatData.firstName && selectedChatData.firstName.trim() !== ""
                            ? selectedChatData.firstName.charAt(0)
                            : selectedChatData.email && selectedChatData.email.trim() !== ""
                            ? selectedChatData.email.charAt(0)
                            : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <div className="text-xl font-bold mb-1">
                          {selectedChatData.firstName
                            ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                            : selectedChatData.email}
                        </div>
                        <div className="text-sm text-fuchsia-200/80 mb-2">{selectedChatData.email}</div>
                      </div>
                    </div>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </>
          )}
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
