import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { getColor } from "@/lib/utils";
import { HOST, ADD_CHANNEL_ADMIN_ROUTE, REMOVE_CHANNEL_ADMIN_ROUTE, DELETE_CHANNEL_ROUTE, UPDATE_CHANNEL_ROUTE } from "@/utils/constants.js";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaUserShield, FaTrashAlt, FaUserTimes } from "react-icons/fa";

const ChatHeader = () => {
  const { userInfo, closeChat, selectedChatData, selectedChatType, setSelectedChatData, setChannels, channels, removeChannel, updateChannelData } = useAppStore();
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
  const [openAddAdminModal, setOpenAddAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

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
    setEditName(selectedChatData.name || "");
    setEditDescription(selectedChatData.description || "");
    
    // Mevcut üyeleri doğru formatta ayarla
    const members = selectedChatData.members || [];
    setEditMembers(members.map(m => ({ 
      label: m.firstName ? `${m.firstName} ${m.lastName}` : m.email, 
      value: m._id 
    })));
    
    // Yönetici ekleme seçimini sıfırla
    setSelectedAdmin(null);
    
    setEditImage(null);
    setPreviewImage(null);
    setEditMode(true);
    
    // Düzenleme başladığında kişileri yükle
    fetchContacts();
  };

  // Edit modundan çık
  const cancelEdit = () => {
    setEditMode(false);
    setEditName("");
    setEditDescription("");
    setEditMembers([]);
    setEditImage(null);
    setPreviewImage(null);
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
        `${UPDATE_CHANNEL_ROUTE}/${selectedChatData._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 200) {
        updateChannelData(response.data.channel);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Kanal güncelleme hatası:", error);
      alert("Kanal güncellenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme modunda admin ekleme işlemi
  const handleAddAdminInEditMode = async () => {
    if (!selectedAdmin) return;
    
    try {
      const response = await apiClient.post(ADD_CHANNEL_ADMIN_ROUTE, {
        channelId: selectedChatData._id,
        userId: selectedAdmin.value
      }, { withCredentials: true });
      
      if (response.status === 200) {
        // updateChannelData fonksiyonunu kullan
        updateChannelData(response.data.channel);
        setSelectedAdmin(null);
        // Success mesajı göster
        alert("Yönetici başarıyla eklendi");
      }
    } catch (error) {
      console.error("Admin ekleme hatası:", error);
      alert("Admin eklenemedi!");
    }
  };

  // Admin kaldır
  const handleRemoveAdmin = async (adminId) => {
    try {
      const response = await apiClient.post(REMOVE_CHANNEL_ADMIN_ROUTE, {
        channelId: selectedChatData._id,
        userId: adminId
      }, { withCredentials: true });
      
      if (response.status === 200) {
        updateChannelData(response.data.channel);
      }
    } catch (error) {
      console.error("Admin kaldırma hatası:", error);
      alert("Admin kaldırılamadı!");
    }
  };

  // Kanalı sil
  const handleDeleteChannel = async () => {
    try {
      const response = await apiClient.delete(`${DELETE_CHANNEL_ROUTE}/${selectedChatData._id}`, { withCredentials: true });
      
      if (response.status === 200) {
        // Kanal listesinden kaldır
        const updatedChannels = channels.filter(c => c._id !== selectedChatData._id);
        setChannels(updatedChannels);
        closeChat(); // Chat ekranını kapat
        setConfirmDeleteModal(false);
        setOpenInfoModal(false);
      }
    } catch (error) {
      alert("Kanal silinemedi!");
    }
  };

  // Kullanıcı adminlere eklenebilir mi kontrol et
  const getAddableAdmins = () => {
    if (!selectedChatData || !selectedChatData.admins || !selectedChatData.members || !allContacts) {
      return [];
    }
    
    try {
      // Şu anki adminlerin ID'lerini al
      const currentAdminIds = selectedChatData.admins.map(admin => admin._id);
      
      // Üyelerden adminler dışındakileri döndür
      return allContacts.filter(contact => 
        !currentAdminIds.includes(contact.value) && 
        selectedChatData.members.some(member => member._id === contact.value)
      );
    } catch (error) {
      console.error("Admin listesi oluşturulurken hata:", error);
      return [];
    }
  };

  // Kullanıcı kanalın sahibi mi (creator) kontrol et
  const isCreator = React.useMemo(() => {
    if (!userInfo || !selectedChatData || !selectedChatData.creator) return false;
    
    const userId = userInfo.id || userInfo._id;
    const creatorId = selectedChatData.creator._id;
    
    return userId === creatorId;
  }, [userInfo, selectedChatData]);
  
  // Kullanıcı admin mi kontrol et
  const isAdmin = React.useMemo(() => {
    if (!userInfo || !selectedChatData || !selectedChatData.admins) return false;
    
    const userId = userInfo.id || userInfo._id;
    
    return selectedChatData.admins.some(admin => {
      const adminId = admin._id;
      return userId === adminId;
    });
  }, [userInfo, selectedChatData]);
  
  // Debug
  React.useEffect(() => {
    if (selectedChatType === "channel" && selectedChatData) {
      console.group("KANAL BİLGİLERİ");
      console.log("Kanal:", selectedChatData);
      console.log("Kullanıcı:", userInfo);
      console.log("Kullanıcı ID:", userInfo?.id || userInfo?._id);
      console.log("Kanal kurucusu ID:", selectedChatData.creator?._id);
      console.log("Admin listesi:", selectedChatData.admins?.map(a => a._id));
      console.log("İzinler:", { isCreator, isAdmin });
      console.groupEnd();
    }
  }, [selectedChatData, selectedChatType, userInfo, isCreator, isAdmin]);

  // Admin ekle (modal için)
  const handleAddAdmin = async () => {
    if (!selectedAdmin && !selectedChatData) {
      alert("Lütfen bir kullanıcı seçin");
      return;
    }
    
    // Seçilen kullanıcının ID'sini al (bu artık bir nesne değil, doğrudan ID)
    const userId = selectedAdmin?.value || selectedAdmin;
    
    try {
      console.log("Admin ekleniyor:", userId, "Kanal:", selectedChatData._id);
      
      const response = await apiClient.post(ADD_CHANNEL_ADMIN_ROUTE, {
        channelId: selectedChatData._id,
        userId: userId
      }, { withCredentials: true });
      
      if (response.status === 200) {
        console.log("Admin eklendi:", response.data);
        // updateChannelData fonksiyonunu kullan
        updateChannelData(response.data.channel);
        setOpenAddAdminModal(false);
        setSelectedAdmin(null);
        alert("Admin başarıyla eklendi");
      }
    } catch (error) {
      console.error("Admin ekleme hatası:", error);
      alert("Admin eklenemedi: " + (error.response?.data?.message || error.message || "Bilinmeyen hata"));
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
                          
                          {/* Admin kontrolleri */}
                          <div className="flex justify-center mb-4 space-x-2">
                            {/* Düzenle butonu - şimdilik herkese görünür yap */}
                            <button 
                              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                              onClick={startEdit}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Düzenle
                            </button>
                            
                            {/* Admin ekle butonu - her zaman görünür */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                                    onClick={() => {
                                      console.log("Admin ekle butonuna tıklandı");
                                      console.log("isCreator:", isCreator);
                                      console.log("isAdmin:", isAdmin);
                                      // Tüm üyeler
                                      console.log("Üyeler:", selectedChatData.members);
                                      // Tüm adminler
                                      console.log("Adminler:", selectedChatData.admins);
                                      
                                      // Modal'ı aç
                                      setOpenAddAdminModal(true);
                                    }}
                                  >
                                    <FaUserShield className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1c1b1e] border-none p-2 text-white">
                                  Admin Ekle
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {/* Kanalı sil butonu - sadece kurucu */}
                            {isCreator && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                                      onClick={() => setConfirmDeleteModal(true)}
                                    >
                                      <FaTrashAlt className="h-5 w-5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-[#1c1b1e] border-none p-2 text-white">
                                    Kanalı Sil
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          
                          {/* Kanal kurucusu bilgisi */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Kanal Kurucusu</h4>
                            <div className="bg-purple-900/30 p-3 rounded-lg flex items-center gap-3">
                              <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                {selectedChatData.creator?.image ? (
                                  <AvatarImage
                                    src={`${HOST}/${selectedChatData.creator.image}`}
                                    alt="creator-avatar"
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <AvatarFallback className={`${getColor(selectedChatData.creator?.color)} uppercase h-8 w-8 text-sm flex items-center justify-center`}>
                                    {selectedChatData.creator?.firstName?.charAt(0) || '#'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span>
                                {selectedChatData.creator?.firstName 
                                  ? `${selectedChatData.creator.firstName} ${selectedChatData.creator.lastName}`
                                  : selectedChatData.creator?.email || 'Bilinmiyor'}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Kurucu ID: {selectedChatData.creator?._id || 'Bilinmiyor'} <br />
                              Kullanıcı ID: {userInfo?.id || userInfo?._id || 'Bilinmiyor'} <br />
                              İzin Durumları: Admin={isAdmin ? 'Evet' : 'Hayır'}, Kurucu={isCreator ? 'Evet' : 'Hayır'}
                            </div>
                          </div>
                          
                          {/* Adminler listesi */}
                          {selectedChatData.admins && selectedChatData.admins.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Yöneticiler</h4>
                              <div className="space-y-2">
                                {selectedChatData.admins.map(admin => (
                                  <div key={admin._id} className="bg-purple-900/30 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                        {admin.image ? (
                                          <AvatarImage
                                            src={`${HOST}/${admin.image}`}
                                            alt="admin-avatar"
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <AvatarFallback className={`${getColor(admin.color)} uppercase h-8 w-8 text-sm flex items-center justify-center`}>
                                            {admin.firstName?.charAt(0) || '#'}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <span>
                                        {admin.firstName 
                                          ? `${admin.firstName} ${admin.lastName}`
                                          : admin.email || 'Bilinmiyor'}
                                      </span>
                                    </div>
                                    
                                    {/* Admin kaldırma butonu - sadece kurucu görür ve kendisini kaldıramaz */}
                                    {isCreator && admin._id !== selectedChatData.creator._id && (
                                      <button 
                                        className="text-red-400 hover:text-red-600"
                                        onClick={() => handleRemoveAdmin(admin._id)}
                                      >
                                        <FaUserTimes className="h-5 w-5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Üyeler listesi */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Üyeler ({selectedChatData.members.length})</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                              {selectedChatData.members.map(member => (
                                <div key={member._id} className="bg-[#2c2e3b]/50 p-2 rounded-lg flex items-center gap-3">
                                  <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                    {member.image ? (
                                      <AvatarImage
                                        src={`${HOST}/${member.image}`}
                                        alt="member-avatar"
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <AvatarFallback className={`${getColor(member.color)} uppercase h-8 w-8 text-sm flex items-center justify-center`}>
                                        {member.firstName?.charAt(0) || '#'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>
                                    {member.firstName 
                                      ? `${member.firstName} ${member.lastName}`
                                      : member.email || 'Bilinmiyor'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
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
                              defaultOptions={allContacts || []}
                              value={editMembers}
                              onChange={setEditMembers}
                              placeholder="Kişi Ekle/Çıkar"
                              emptyIndicator={<p className="text-center text-lg leading-10 text-gray-600">Sonuç bulunamadı.</p>}
                            />
                          </div>
                          
                          {/* Admin Ekleme Bölümü - Sadece kanal sahibi (creator) için görünür */}
                          {isCreator && (
                            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/40">
                              <h4 className="text-md font-medium text-blue-400 mb-3">Yönetici Ekle</h4>
                              <div className="space-y-2">
                                <select
                                  className="w-full rounded-lg p-2 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-blue-500"
                                  onChange={(e) => {
                                    const selected = getAddableAdmins().find(u => u.value === e.target.value);
                                    setSelectedAdmin(selected || null);
                                  }}
                                  value={selectedAdmin?.value || ""}
                                >
                                  <option value="">Üyeler arasından yönetici seçin</option>
                                  {getAddableAdmins().map(contact => (
                                    <option key={contact.value} value={contact.value}>{contact.label}</option>
                                  ))}
                                </select>
                                <button 
                                  className="w-full bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={handleAddAdminInEditMode}
                                  disabled={!selectedAdmin}
                                >
                                  <FaUserShield className="h-4 w-4" />
                                  Yönetici Olarak Ekle
                                </button>
                              </div>
                              
                              {/* Mevcut Yöneticiler */}
                              {selectedChatData.admins && selectedChatData.admins.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium text-gray-400 mb-2">Mevcut Yöneticiler</h5>
                                  <div className="max-h-40 overflow-y-auto space-y-2">
                                    {selectedChatData.admins.map(admin => (
                                      <div key={admin._id} className="flex items-center justify-between p-2 bg-[#2c2e3b] rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6 rounded-full overflow-hidden">
                                            {admin.image ? (
                                              <AvatarImage
                                                src={`${HOST}/${admin.image}`}
                                                alt="admin-avatar"
                                                className="object-cover w-full h-full"
                                              />
                                            ) : (
                                              <AvatarFallback className={`${getColor(admin.color)} uppercase h-6 w-6 text-xs flex items-center justify-center`}>
                                                {admin.firstName?.charAt(0) || '#'}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                          <span className="text-sm">
                                            {admin.firstName 
                                              ? `${admin.firstName} ${admin.lastName}`
                                              : admin.email || 'Bilinmiyor'}
                                          </span>
                                        </div>
                                        
                                        {/* Kaldırma butonu - kurucuyu kaldıramaz */}
                                        {admin._id !== selectedChatData.creator._id && (
                                          <button 
                                            className="text-red-400 hover:text-red-600"
                                            onClick={() => handleRemoveAdmin(admin._id)}
                                          >
                                            <FaUserTimes className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-3 justify-end mt-2">
                            <button 
                              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              İptal
                            </button>
                            <button 
                              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                              onClick={handleUpdate}
                              disabled={loading}
                            >
                              {loading ? 'Güncelleniyor...' : 'Güncelle'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              
              {/* Admin Ekleme Modalı */}
              <Dialog open={openAddAdminModal} onOpenChange={setOpenAddAdminModal}>
                <DialogContent className="bg-[#181920] border-none text-white w-[350px]">
                  <DialogHeader>
                    <DialogTitle>Yönetici Ekle</DialogTitle>
                    <DialogDescription>
                      Kanala yeni bir yönetici ekleyin.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedChatData && selectedChatData.members ? (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Kullanıcı Seç</label>
                        <select
                          className="w-full rounded-lg p-2 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-purple-500"
                          onChange={(e) => setSelectedAdmin(e.target.value)}
                          value={selectedAdmin || ""}
                        >
                          <option value="">Seçiniz</option>
                          {selectedChatData.members
                            .filter(member => {
                              // Zaten admin olanları filtrele
                              const isAlreadyAdmin = selectedChatData.admins && 
                                selectedChatData.admins.some(admin => admin._id === member._id);
                              return !isAlreadyAdmin;
                            })
                            .map(member => (
                              <option key={member._id} value={member._id}>
                                {member.firstName 
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.email || 'Kullanıcı'}
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button 
                          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                          onClick={() => {
                            setOpenAddAdminModal(false);
                            setSelectedAdmin(null);
                          }}
                        >
                          İptal
                        </button>
                        <button 
                          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                          onClick={handleAddAdmin}
                          disabled={!selectedAdmin}
                        >
                          <FaUserShield className="h-4 w-4" />
                          Ekle
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="py-2 text-center text-gray-400">Üye bulunamadı.</p>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Kanal Silme Onay Modalı */}
              <Dialog open={confirmDeleteModal} onOpenChange={setConfirmDeleteModal}>
                <DialogContent className="bg-[#181920] border-none text-white w-[350px]">
                  <DialogHeader>
                    <DialogTitle className="text-red-500">Kanalı Sil</DialogTitle>
                    <DialogDescription>
                      Bu işlem geri alınamaz. Kanalı silmek istediğinize emin misiniz?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2 mt-4">
                    <button 
                      className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      onClick={() => setConfirmDeleteModal(false)}
                    >
                      İptal
                    </button>
                    <button 
                      className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      onClick={handleDeleteChannel}
                    >
                      <FaTrashAlt className="h-4 w-4" />
                      Sil
                    </button>
                  </div>
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
        <div>
          <RiCloseFill
            size={30}
            className="text-[#34365c] hover:text-white cursor-pointer transition-all duration-200"
            onClick={closeChat}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
