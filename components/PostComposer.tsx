import React, { useState, useRef } from 'react';
import { Image, X, Sparkles, Send, Loader2, Video } from 'lucide-react';
import { enhancePostContent, generatePostIdeas } from '../services/geminiService';
import { fileToBase64 } from '../services/db';

interface PostComposerProps {
  onPost: (text: string, media?: { url: string, type: 'image' | 'video' }) => Promise<void>;
}

const PostComposer: React.FC<PostComposerProps> = ({ onPost }) => {
  const [text, setText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [media, setMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnhance = async () => {
    if (!text) {
        // Generate ideas if empty
        setIsEnhancing(true);
        try {
            const ideas = await generatePostIdeas();
            if (ideas.length > 0) setText(ideas[0]);
        } finally {
            setIsEnhancing(false);
        }
        return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await enhancePostContent(text);
      setText(enhanced);
    } catch (e) {
      // Fail silently or show toast
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      // Limit file size for P2P stability (e.g. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large for P2P sync (Max 5MB)");
        return;
      }
      
      try {
        const base64 = await fileToBase64(file);
        setMedia({ url: base64, type: isVideo ? 'video' : 'image' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    if ((!text.trim() && !media) || isPosting) return;
    setIsPosting(true);
    try {
      await onPost(text, media || undefined);
      setText('');
      setMedia(null);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="border-b border-dark-border p-4 pb-2">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <textarea
            className="w-full bg-black text-white text-xl placeholder-gray-500 border-none outline-none resize-none h-24 p-2"
            placeholder="What is happening on your local machine?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {media && (
            <div className="relative mt-2 mb-4 rounded-xl overflow-hidden border border-dark-border max-w-md">
              <button 
                onClick={() => setMedia(null)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1 text-white transition"
              >
                <X size={18} />
              </button>
              {media.type === 'image' ? (
                <img src={media.url} alt="Upload" className="w-full max-h-96 object-cover" />
              ) : (
                <video src={media.url} controls className="w-full max-h-96" />
              )}
            </div>
          )}

          <div className="border-t border-dark-border pt-3 flex items-center justify-between">
            <div className="flex gap-2 text-sky-500">
              <button 
                className="p-2 hover:bg-sky-500/10 rounded-full transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={20} />
              </button>
              <button className="p-2 hover:bg-sky-500/10 rounded-full transition hidden sm:block">
                <Video size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              
              <button 
                onClick={handleEnhance}
                disabled={isEnhancing}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${isEnhancing ? 'text-purple-300' : 'text-purple-400 hover:bg-purple-500/10'}`}
              >
                {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span className="hidden sm:inline">AI Assist</span>
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={(!text && !media) || isPosting}
              className="bg-white text-black font-bold px-5 py-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
