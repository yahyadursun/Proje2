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
import { ScrollArea } from "@/components/ui/scroll-area";
import Lottie from "react-lottie";
import { animationDefaultOptions } from "@/lib/utils";
import { SEARCH_CONTACTS_ROUTES } from "@/utils/constants";
import apiClient from "@/lib/api-client.js";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constants.js";
import { useAppStore } from "@/store";

const NewDM = () => {
  const { setSelectedChatType, setSelectedChatData } = useAppStore();
  const [openNewContactModal, setOpenNewContactModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const searchContacts = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const response = await apiClient.post(
          SEARCH_CONTACTS_ROUTES,
          { searchTerm },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data.contacts) {
          setSearchedContacts(response.data.contacts);
        }
      } else {
        setSearchedContacts([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const selectNewContact = (contact) => {
    setSelectedId(contact._id);
    setTimeout(() => {
      setOpenNewContactModal(false);
      setSelectedChatType("contact");
      setSelectedChatData(contact);
      setSearchedContacts([]);
      setSelectedId(null);
    }, 350);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300 text-2xl"
              onClick={() => setOpenNewContactModal(true)}
            ></FaPlus>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
            Yeni sohbet olustur
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={openNewContactModal} onOpenChange={setOpenNewContactModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[420px] max-w-full flex flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-400 mb-1">Yeni Mesaj</DialogTitle>
            <DialogDescription className="text-fuchsia-200/80 mb-2">Bir kullanıcı arayın ve seçin.</DialogDescription>
          </DialogHeader>
          <div>
            <Input
              placeholder="Kullanıcı Ara"
              className="rounded-xl p-4 bg-[#2c2e3b] border-none text-lg focus:ring-2 focus:ring-fuchsia-500"
              onChange={(e) => searchContacts(e.target.value)}
            />
          </div>
          {searchedContacts.length > 0 && (
            <ScrollArea className="h-[250px]">
              <div className="flex flex-col gap-3">
                {searchedContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className={`flex gap-4 items-center cursor-pointer rounded-xl p-3 transition-all duration-200 border border-transparent hover:border-fuchsia-500 bg-[#23243a]/60 hover:bg-[#2c2e3b] shadow-sm ${selectedId === contact._id ? 'scale-95 bg-fuchsia-700/20 border-fuchsia-500' : ''}`}
                    onClick={() => selectNewContact(contact)}
                  >
                    <Avatar className="h-12 w-12 rounded-full overflow-hidden border-2 border-fuchsia-500">
                      {contact.image ? (
                        <AvatarImage
                          src={`${HOST}/${contact.image}`}
                          alt="profile"
                          className="object-cover w-full h-full bg-black rounded-full"
                        />
                      ) : (
                        <div
                          className={`uppercase h-12 w-12 text-lg flex items-center justify-center ${getColor(contact.color)}`}
                        >
                          {contact.firstName && contact.firstName.trim() !== ""
                            ? contact.firstName.charAt(0)
                            : contact.email && contact.email.trim() !== ""
                            ? contact.email.charAt(0)
                            : ""}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {contact.firstName && contact.lastName
                          ? `${contact.firstName} ${contact.lastName}`
                          : contact.email}
                      </span>
                      <span className="text-xs text-fuchsia-200/80">{contact.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {searchedContacts.length <= 0 && (
            <div className="flex-1  md:flex mt-5 md:mt-0 flex-col justify-center item-center  duration-1000 transition-all">
              <Lottie
                isClickToPauseDisabled={true}
                height={100}
                width={100}
                options={animationDefaultOptions}
              />
              <div className="text-opacity-80 text-white felx felx-col gap-5 item-center mt-5 lg:text-2xl text-xl transition-all duration-300 text-center">
                <h3 className="poppins-medium">
                  Yeni kişi<span className="text-purple-500"></span>
                  <span className="text-purple-500"> Ara</span>
                </h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewDM;
