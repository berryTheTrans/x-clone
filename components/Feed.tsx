import React from 'react';
import { Post } from '../types';
import { MessageCircle, Repeat2, Heart, Share, Trash2 } from 'lucide-react';

interface FeedProps {
  posts: Post[];
  loading: boolean;
  isHost: boolean;
  onDelete?: (id: string) => void;
}

const Feed: React.FC<FeedProps> = ({ posts, loading, isHost, onDelete }) => {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-xl font-bold mb-2">No posts yet</p>
        <p>Posts stored on the device will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <article key={post.id} className="border-b border-dark-border p-4 hover:bg-white/5 transition duration-200 cursor-pointer">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white hover:underline">User</span>
                  <span className="text-gray-500 text-sm">@{post.authorId.substring(0, 8)}...</span>
                  <span className="text-gray-500 text-sm">· {new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
                {isHost && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                        className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
              </div>
              
              <div className="text-white whitespace-pre-wrap mb-3 text-[15px] leading-relaxed">
                {post.content}
              </div>

              {post.mediaUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-dark-border">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls className="w-full max-h-[500px] bg-black" />
                  ) : (
                    <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[500px] object-cover" />
                  )}
                </div>
              )}

              <div className="flex justify-between text-gray-500 max-w-md mt-2">
                <ActionItem icon={<MessageCircle size={18} />} count={0} color="hover:text-sky-500 hover:bg-sky-500/10" />
                <ActionItem icon={<Repeat2 size={18} />} count={0} color="hover:text-green-500 hover:bg-green-500/10" />
                <ActionItem icon={<Heart size={18} />} count={0} color="hover:text-pink-500 hover:bg-pink-500/10" />
                <ActionItem icon={<Share size={18} />} color="hover:text-sky-500 hover:bg-sky-500/10" />
              </div>
            </div>
          </div>
        </article>
      ))}
      <div className="h-20" /> {/* Spacer */}
    </div>
  );
};

const ActionItem = ({ icon, count, color }: { icon: React.ReactNode, count?: number, color: string }) => (
  <div className={`flex items-center gap-1 group transition cursor-pointer ${color}`}>
    <div className="p-2 rounded-full transition group-hover:bg-opacity-10">
      {icon}
    </div>
    {count !== undefined && <span className="text-sm">{count}</span>}
  </div>
);

export default Feed;
