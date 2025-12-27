import React from 'react';
import { Home, User, Settings, Feather, Share2, Radio } from 'lucide-react';

interface SidebarProps {
  onComposeClick: () => void;
  isHost: boolean;
  onCopyLink: () => void;
  peerId: string | null;
  connectionCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onComposeClick, isHost, onCopyLink, peerId, connectionCount }) => {
  return (
    <div className="hidden sm:flex flex-col w-20 xl:w-64 h-screen sticky top-0 border-r border-dark-border px-2 xl:px-4 py-4 justify-between">
      <div className="flex flex-col gap-4">
        <div className="p-3 w-min hover:bg-dark-hover rounded-full cursor-pointer transition-colors mb-2">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem icon={<Home size={26} />} text="Home" active />
          <SidebarItem icon={<User size={26} />} text="Profile" />
          <SidebarItem icon={<Settings size={26} />} text="Settings" />
        </nav>

        <button 
          onClick={onComposeClick}
          disabled={!isHost}
          className={`mt-4 bg-white text-black font-bold text-lg rounded-full py-3 px-8 xl:w-full shadow-md hover:bg-gray-200 transition-colors hidden xl:block disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isHost ? 'Post' : 'Read Only'}
        </button>
        
        <div className="xl:hidden flex justify-center mt-4">
            <button 
             onClick={onComposeClick}
             disabled={!isHost}
             className="bg-white text-black rounded-full p-3 shadow-md hover:bg-gray-200 disabled:opacity-50"
            >
                <Feather size={24} />
            </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4">
         {isHost && peerId && (
            <div className="p-4 rounded-xl border border-dark-border bg-black">
                <div className="flex items-center gap-2 mb-2 text-green-500 font-mono text-xs uppercase">
                    <Radio size={12} className="animate-pulse" />
                    Live Server
                </div>
                <p className="text-gray-500 text-xs mb-3">
                    Your laptop is the server. Keep this tab open to share.
                </p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>{connectionCount} peers</span>
                </div>
                <button 
                    onClick={onCopyLink}
                    className="w-full flex items-center justify-center gap-2 border border-dark-border text-white text-sm font-bold rounded-full py-2 hover:bg-dark-hover transition"
                >
                    <Share2 size={16} />
                    Share Link
                </button>
            </div>
         )}
         
         {!isHost && (
            <div className="p-4 rounded-xl border border-dark-border bg-black">
                <div className="flex items-center gap-2 mb-2 text-blue-500 font-mono text-xs uppercase">
                    <Radio size={12} />
                    Remote View
                </div>
                <p className="text-gray-500 text-xs">
                    You are viewing a decentralized blog hosted on another device.
                </p>
            </div>
         )}

         <div className="flex items-center gap-3 p-3 hover:bg-dark-hover rounded-full cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                {isHost ? 'ME' : 'PE'}
            </div>
            <div className="hidden xl:block">
                <p className="font-bold text-sm">{isHost ? 'Local Host' : 'Peer User'}</p>
                <p className="text-gray-500 text-sm">@{isHost ? 'localhost' : 'guest'}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active }: { icon: React.ReactNode, text: string, active?: boolean }) => (
  <div className={`flex items-center gap-4 p-3 rounded-full cursor-pointer transition-colors w-max xl:w-auto ${active ? 'font-bold' : 'hover:bg-dark-hover'}`}>
    {icon}
    <span className={`hidden xl:inline text-xl ${active ? 'text-white' : 'text-gray-300'}`}>{text}</span>
  </div>
);

export default Sidebar;
