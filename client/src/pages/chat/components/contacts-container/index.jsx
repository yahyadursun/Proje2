import ProfileInfo from "./componenets/profile-info";
import NewDM from "./componenets/new-dm";
import { useEffect } from "react";
import apiClient from "@/lib/api-client";
import { GET_DM_CONTACTS_ROUTES } from "@/utils/constants";
import { useAppStore } from "@/store";
import ContactList from "@/components/contact-list";
import CreateChannel from "./componenets/create-channel";
import { GET_USER_CHANNELS_ROUTES } from "../../../../utils/constants";
const ContactsContainer = () => {
  const {
    setDirectMessagesContacts,
    directMessagesContacts,
    channels,
    setChannels,
  } = useAppStore();

  useEffect(() => {
    const getContacts = async () => {
      const response = await apiClient.get(GET_DM_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      if (response.data.contacts) {
        setDirectMessagesContacts(response.data.contacts);
      }
    };

    const getChannels = async () => {
      const response = await apiClient.get(GET_USER_CHANNELS_ROUTES, {
        withCredentials: true,
      });
      if (response.data.channels) {
        setChannels(response.data.channels);
      }
    };

    getContacts();
    getChannels();
  }, [setChannels, setDirectMessagesContacts]);

  return (
    <div className="flex flex-col h-screen md:w-[35vw] lg:w-[30vw] xl:w-[20vw] w-full bg-gradient-to-b from-[#23243a] via-[#1b1c24] to-[#181920] border-r border-[#23243a] shadow-xl">
      <div className="pt-3 pb-2 border-b border-[#23243a] bg-[#23243a]/40">
        <Logo />
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="overflow-y-auto flex-1 px-2 py-4 space-y-6 custom-scrollbar">
          <div className="bg-[#23243a]/60 rounded-xl shadow p-3">
            <div className="flex items-center justify-between mb-2">
              <Title text="Mesajlar" />
              <NewDM />
            </div>
            <div className="space-y-1">
              <ContactList contacts={directMessagesContacts} />
            </div>
          </div>
          <div className="bg-[#23243a]/60 rounded-xl shadow p-3">
            <div className="flex items-center justify-between mb-2">
              <Title text="Kanallar" />
              <CreateChannel />
            </div>
            <div className="space-y-1">
              <ContactList contacts={channels} isChannel={true} />
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#23243a] bg-[#23243a]/40 px-2 py-4">
        <ProfileInfo />
      </div>
    </div>
  );
};

export default ContactsContainer;

const Logo = () => {
  return (
    <div className="flex p-5 justify-start items-center gap-2">
      <svg
        id="logo-studybuddy"
        width="48"
        height="48"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient tanımı */}
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3A86FF" />
            <stop offset="100%" stopColor="#8338EC" />
          </linearGradient>
        </defs>

        {/* Konuşma balonu */}
        <path
          d="M20 14C20 11.7909 21.7909 10 24 10H48C50.2091 10 52 11.7909 52 14V30C52 32.2091 50.2091 34 48 34H38L30 40V34H24C21.7909 34 20 32.2091 20 30V14Z"
          fill="url(#gradient)"
        />

        {/* 1. İnsan figürü */}
        <circle cx="34" cy="20" r="2.5" fill="white" />
        <path
          d="M31 25C31 23.8954 31.8954 23 33 23H35C36.1046 23 37 23.8954 37 25V26H31V25Z"
          fill="white"
        />

        {/* 2. İnsan figürü */}
        <circle cx="42" cy="20" r="2.5" fill="white" />
        <path
          d="M39 25C39 23.8954 39.8954 23 41 23H43C44.1046 23 45 23.8954 45 25V26H39V25Z"
          fill="white"
        />
      </svg>

      <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3A86FF] to-[#8338EC] tracking-tight">
        StudyBuddy
      </span>
    </div>
  );
};

const Title = ({ text }) => {
  return (
    <h6 className="text-base font-semibold tracking-wide text-neutral-300 uppercase letter-spacing-[0.1em]">
      {text}
    </h6>
  );
};
