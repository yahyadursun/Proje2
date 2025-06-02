export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatData: undefined,
  selectedChatMessages: [],
  directMessagesContacts: [],
  isUploading: false,
  isDownloading: false,
  fileUploadProgress: 0,
  fileDownloadProgress: 0,
  channels: [],
  setChannels: (channels) => set({ channels }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
  setFileDownloadProgress: (fileDownloadProgress) =>
    set({ fileDownloadProgress }),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
  setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
  setSelectedChatMessages: (selectedChatMessages) =>
    set({ selectedChatMessages }),
  setDirectMessagesContacts: (directMessagesContacts) =>
    set({ directMessagesContacts }),
  addChannel: (channel) => {
    const channels = get().channels;
    set({ channels: [channel, ...channels] });
  },
  updateChannelData: (updatedChannel) => {
    // Seçili kanal bu ise, onu da güncelle
    const selectedChatData = get().selectedChatData;
    const selectedChatType = get().selectedChatType;
    
    if (selectedChatType === "channel" && selectedChatData && selectedChatData._id === updatedChannel._id) {
      set({ selectedChatData: updatedChannel });
    }
    
    // Kanal listesinde kanalı güncelle
    const channels = get().channels;
    const updatedChannels = channels.map(channel => 
      channel._id === updatedChannel._id ? updatedChannel : channel
    );
    
    set({ channels: updatedChannels });
  },
  removeChannel: (channelId) => {
    const channels = get().channels;
    set({ channels: channels.filter(channel => channel._id !== channelId) });
    // Eğer silinen kanal seçili ise sohbeti kapat
    const selectedChatData = get().selectedChatData;
    if (selectedChatData && selectedChatData._id === channelId) {
      set({
        selectedChatData: undefined,
        selectedChatType: undefined,
        selectedChatMessages: [],
      });
    }
  },
  closeChat: () =>
    set({
      selectedChatData: undefined,
      selectedChatType: undefined,
      selectedChatMessages: [],
    }),
  addMessage: (message) => {
    const selectedChatMessages = get().selectedChatMessages;
    const selectedChatType = get().selectedChatType;
    set({
      selectedChatMessages: [
        ...selectedChatMessages,
        {
          ...message,
          recipient:
            selectedChatType === "channel"
              ? message.recipient
              : message.recipient._id,
          sender:
            selectedChatType === "channel"
              ? message.sender
              : message.sender._id,
        },
      ],
    });
  },
  addChannelInChannelList: (message) => {
    const channels = get().channels;
    const data = channels.find((channel) => channel._id === message.channelId);
    const index = channels.findIndex(
      (channel) => channel._id === message.channelId
    );
    if (index !== -1 && index !== undefined) {
      channels.splice(index, 1);
      channels.unshift(data);
    }
  },
  addContactsInDMCOnctacts: (message) => {
    const userId = get().userInfo.id;
    const fromId =
      message.sender._id === userId
        ? message.recipient._id
        : message.sender._id;
    const fromData =
      message.sender._id === userId ? message.recipient : message.sender;
    const dmContacts = get().directMessagesContacts;

    // Kontağın zaten listede olup olmadığını kontrol et
    const existingContactIndex = dmContacts.findIndex(
      (contact) => contact._id === fromId || contact.id === fromId
    );

    if (existingContactIndex !== -1) {
      // Eğer kontak zaten varsa, onu listenin başına taşı
      const existingContact = dmContacts[existingContactIndex];
      dmContacts.splice(existingContactIndex, 1);
      dmContacts.unshift(existingContact);
    } else {
      // Eğer kontak yoksa, yeni kontağı ekle
      dmContacts.unshift(fromData);
    }

    set({ directMessagesContacts: dmContacts });
  },
});
