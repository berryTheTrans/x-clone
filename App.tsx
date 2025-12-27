import React, { useEffect, useState, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import Sidebar from './components/Sidebar';
import PostComposer from './components/PostComposer';
import Feed from './components/Feed';
import { Post, P2PMessage } from './types';
import { savePost, getAllPosts, initDB } from './services/db';

const App: React.FC = () => {
  // State
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(true); // Default to host unless URL param
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [hostConnection, setHostConnection] = useState<DataConnection | null>(null);
  
  // Refs for stability
  const peerRef = useRef<Peer | null>(null);
  const postsRef = useRef<Post[]>([]); // Keep ref for immediate access in callbacks

  // Update posts wrapper
  const updatePosts = (newPosts: Post[]) => {
    // Sort by date desc
    const sorted = [...newPosts].sort((a, b) => b.timestamp - a.timestamp);
    setPosts(sorted);
    postsRef.current = sorted;
  };

  // --- Initialization ---
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Check URL for Host ID
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      const hostId = urlParams.get('host');

      if (hostId) {
        setIsHost(false);
        initPeer(false, hostId);
      } else {
        setIsHost(true);
        await initDB();
        const localPosts = await getAllPosts();
        updatePosts(localPosts);
        initPeer(true);
      }
      setLoading(false);
    };

    initializeApp();

    return () => {
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- PeerJS Logic ---
  const initPeer = (asHost: boolean, targetHostId?: string) => {
    // Dynamically import peerjs would be ideal in some setups, but assuming global or npm is fine
    // Using default Peer constructor.
    // Note: In production, you might want your own turn server for better connectivity.
    // We use the default public cloud server for this demo.
    const peer = new Peer();

    peer.on('open', (id) => {
      console.log('My Peer ID:', id);
      setPeerId(id);

      if (!asHost && targetHostId) {
        connectToHost(peer, targetHostId);
      }
    });

    peer.on('connection', (conn) => {
      if (asHost) {
        handleIncomingConnection(conn);
      } else {
        // As a viewer, we shouldn't really get connections initiate by others usually,
        // but connection logic is bidirectional in data.
        conn.close(); // Reject weird connections if not host
      }
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
    });

    peerRef.current = peer;
  };

  // --- Host Logic: Handle Viewers ---
  const handleIncomingConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      console.log('New peer connected:', conn.peer);
      setConnections(prev => [...prev, conn]);

      // Immediately sync posts to the new peer
      const msg: P2PMessage = {
        type: 'SYNC_RESPONSE',
        payload: postsRef.current
      };
      conn.send(msg);
    });

    conn.on('data', (data) => {
      // Host might receive interactions later (likes etc), ignoring for now
      console.log('Host received data:', data);
    });

    conn.on('close', () => {
      setConnections(prev => prev.filter(c => c.peer !== conn.peer));
    });
  };

  // --- Viewer Logic: Connect to Host ---
  const connectToHost = (peer: Peer, hostId: string) => {
    const conn = peer.connect(hostId, { reliable: true });

    conn.on('open', () => {
      console.log('Connected to Host:', hostId);
      setHostConnection(conn);
      // Request posts (though host sends on open automatically usually)
      const msg: P2PMessage = { type: 'SYNC_REQUEST', payload: null };
      conn.send(msg);
    });

    conn.on('data', (data: any) => {
      const msg = data as P2PMessage;
      if (msg.type === 'SYNC_RESPONSE' || msg.type === 'NEW_POST') {
        const receivedPosts = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
        
        // Merge logic (simple replace for sync, append for new)
        if (msg.type === 'SYNC_RESPONSE') {
            updatePosts(receivedPosts);
        } else {
            updatePosts([...postsRef.current, ...receivedPosts]);
        }
      }
    });

    conn.on('close', () => {
      console.log('Connection to host lost');
      setHostConnection(null);
      alert("Connection to host lost. The host might have closed their tab.");
    });
    
    conn.on('error', (err) => {
        console.error("Connection error", err);
    });
  };

  // --- Actions ---

  const handleCreatePost = async (text: string, media?: { url: string, type: 'image' | 'video' }) => {
    if (!isHost || !peerId) return;

    const newPost: Post = {
      id: crypto.randomUUID(),
      content: text,
      mediaUrl: media?.url,
      mediaType: media?.type,
      timestamp: Date.now(),
      authorId: peerId
    };

    // 1. Save Local
    await savePost(newPost);
    
    // 2. Update UI
    const updated = [newPost, ...posts];
    updatePosts(updated);

    // 3. Broadcast to Peers
    const msg: P2PMessage = {
      type: 'NEW_POST',
      payload: newPost // Sending as array for consistency handled in receiver or single object? Receiver logic handles it.
    };
    // Let's send a sync response style for robustness or specific NEW_POST
    // My receiver logic handles array or single. Let's send array.
    const broadcastMsg: P2PMessage = { type: 'SYNC_RESPONSE', payload: updated };

    connections.forEach(conn => {
      if (conn.open) {
        conn.send(broadcastMsg);
      }
    });
  };

  const copyLink = () => {
    if (peerId) {
      const url = `${window.location.origin}${window.location.pathname}?host=${peerId}`;
      navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard! Send this to anyone.");
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans flex justify-center">
      <div className="flex w-full max-w-[1265px]">
        {/* Sidebar */}
        <Sidebar 
            onComposeClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            isHost={isHost}
            onCopyLink={copyLink}
            peerId={peerId}
            connectionCount={connections.length}
        />

        {/* Main Feed Section */}
        <main className="flex-1 max-w-[600px] border-r border-dark-border min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border p-3">
             <h1 className="text-xl font-bold px-2">{isHost ? 'Home' : 'Host Feed'}</h1>
          </div>

          {/* Composer (Host Only) */}
          {isHost && (
            <PostComposer onPost={handleCreatePost} />
          )}

          {/* Feed */}
          <Feed 
            posts={posts} 
            loading={loading} 
            isHost={isHost}
            onDelete={async (id) => {
                // Delete logic... (For brevity, only local state update here, implementing full delete sync needs more code)
                const filtered = posts.filter(p => p.id !== id);
                updatePosts(filtered);
            }} 
          />
        </main>

        {/* Right Widget Section (Search/Trends) - Simplified for aesthetic */}
        <div className="hidden lg:flex flex-col w-[350px] pl-8 py-4 gap-4 sticky top-0 h-screen">
            <div className="bg-gray-900 rounded-full py-3 px-5 flex items-center focus-within:bg-black focus-within:ring-1 focus-within:ring-sky-500 border border-transparent transition">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-gray-500 mr-3 fill-current"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.604-1.902l3.682 3.681c.585.586 1.535.586 2.121 0 .586-.585.586-1.536 0-2.121l-3.682-3.681c1.176-1.185 1.902-2.809 1.902-4.604 0-3.59-2.91-6.5-6.5-6.5zm-4.5 6.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5-4.5-2.015-4.5-4.5z"></path></g></svg>
                <input type="text" placeholder="Search" className="bg-transparent outline-none text-white w-full placeholder-gray-500" />
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 border border-dark-border">
                <h2 className="font-bold text-xl mb-4">What's happening</h2>
                <div className="flex flex-col gap-4">
                    <div className="cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition">
                        <p className="text-gray-500 text-xs">Technology · Trending</p>
                        <p className="font-bold">Decentralized Web</p>
                        <p className="text-gray-500 text-xs">10.5K posts</p>
                    </div>
                    <div className="cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition">
                        <p className="text-gray-500 text-xs">AI · Trending</p>
                        <p className="font-bold">Gemini API</p>
                        <p className="text-gray-500 text-xs">52.1K posts</p>
                    </div>
                </div>
            </div>
            
            <div className="text-gray-500 text-xs px-2">
                <p>LocalX Blog © 2024</p>
                <p>Data stored locally on your device.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
