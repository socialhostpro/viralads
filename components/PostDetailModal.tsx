import React, { useEffect, useRef, useState } from 'react';
import { Post, PostStatus, Platform } from '../types';
import { Spinner } from './Spinner';
import { CloseIcon, DownloadIcon, ShareIcon, TrashIcon, GlobeIcon, SparklesIcon,
  BlogIcon, InstagramIcon, FacebookIcon, XIcon, TikTokIcon,
  BlueskyIcon, LinkedInIcon, PressReleaseIcon, YouTubeIcon, PodcastIcon
} from './Icons';
import { ALL_PLATFORMS } from '../services/geminiService';

interface PostDetailModalProps {
  post: Post;
  clientName?: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (post: Post) => void;
  onSendToN8n: (post: Post) => void;
  onUpdatePost: (postId: string, update: Partial<Post>) => void;
  onRepurpose: (sourcePost: Post, targetPlatforms: Platform[]) => void;
}

const platformIcons: Record<Platform, React.ElementType> = {
  [Platform.Blog]: BlogIcon,
  [Platform.Instagram]: InstagramIcon,
  [Platform.Facebook]: FacebookIcon,
  [Platform.X]: XIcon,
  [Platform.TikTok]: TikTokIcon,
  [Platform.Bluesky]: BlueskyIcon,
  [Platform.LinkedIn]: LinkedInIcon,
  [Platform.PressRelease]: PressReleaseIcon,
  [Platform.YouTube]: YouTubeIcon,
  [Platform.Podcast]: PodcastIcon,
};

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, clientName, onClose, onDelete, onDownload, onSendToN8n, onUpdatePost, onRepurpose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const PlatformIcon = platformIcons[post.platform];

  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposePlatforms, setRepurposePlatforms] = useState<Platform[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');
  const [internalNotes, setInternalNotes] = useState(post.internalNotes || '');
  const [clientFeedback, setClientFeedback] = useState(post.clientFeedback || '');


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
        onClose();
        onDelete(post.id);
    }
  }

  const handlePlatformToggle = (platform: Platform) => {
    setRepurposePlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };
  
  const handleRepurposeSubmit = () => {
    if (repurposePlatforms.length === 0) {
        alert("Please select at least one platform to repurpose this content for.");
        return;
    }
    onRepurpose(post, repurposePlatforms);
    onClose();
  }
  
  const handleNotesSave = () => {
    onUpdatePost(post.id, { internalNotes, clientFeedback });
    alert("Notes saved!");
  };
  
  const availablePlatforms = ALL_PLATFORMS.filter(p => p !== post.platform);

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
    >
      <div ref={modalRef} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <PlatformIcon className="h-7 w-7 text-teal-400" />
            <div>
                <h2 id="post-detail-title" className="text-xl font-bold text-white">{post.platform} Post</h2>
                <p className="text-sm text-gray-400">{clientName || 'No Client'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close modal">
            <CloseIcon className="h-6 w-6 text-gray-400" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column (Media) */}
            <div className="space-y-4">
                {post.imageUrl && (<img src={post.imageUrl} alt="Generated media" className="rounded-md w-full aspect-square object-cover" />)}
                {post.videoUrl === 'GENERATING' && (<div className="rounded-md w-full aspect-video bg-gray-700 flex flex-col items-center justify-center"><Spinner /><p className="text-sm text-gray-400 mt-2">Generating video...</p></div>)}
                {post.videoUrl && post.videoUrl !== 'GENERATING' && post.videoUrl !== 'FAILED' && (<video controls src={post.videoUrl} className="rounded-md w-full aspect-video" />)}
                {post.videoUrl === 'FAILED' && (<div className="rounded-md w-full aspect-video bg-red-900/50 border border-red-700 flex flex-col items-center justify-center"><p className="text-sm text-red-300">Video Generation Failed</p></div>)}
                {post.audioUrl && (<div><h4 className="text-sm font-semibold text-gray-400 mb-1">Generated Audio</h4><div className="flex items-center gap-2"><audio controls src={post.audioUrl} className="w-full h-10">Your browser does not support the audio element.</audio><button onClick={() => onDownload({ ...post, videoUrl: undefined, imageUrl: undefined })} title="Download Audio" className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors flex-shrink-0"><DownloadIcon className="h-5 w-5" /></button></div></div>)}
                {post.videoUrl && post.audioUrl && post.videoUrl !== 'GENERATING' && post.videoUrl !== 'FAILED' && (<p className="text-xs text-gray-400 italic text-center pt-2">Tip: Download the video and audio, then combine them in a video editor.</p>)}
                {post.groundingSources && post.groundingSources.length > 0 && (<div className="pt-2"><h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><GlobeIcon className="h-4 w-4"/> Grounding Sources:</h4><ul className="text-sm text-teal-400 space-y-1 max-h-40 overflow-y-auto">{post.groundingSources.map((source, index) => (<li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block" title={source.uri}>{source.title || source.uri}</a></li>))}</ul></div>)}
            </div>

            {/* Right Column (Content & Meta) */}
            <div className="space-y-4">
                 <div>
                    <div className="border-b border-gray-700 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setActiveTab('content')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'content' ? 'border-teal-400 text-teal-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Content</button>
                            <button onClick={() => setActiveTab('notes')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes' ? 'border-teal-400 text-teal-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Notes & Feedback</button>
                        </nav>
                    </div>
                    {activeTab === 'content' ? (
                        <div className="bg-gray-900/50 p-3 rounded-md max-h-[40vh] overflow-y-auto"><p className="text-gray-300 whitespace-pre-wrap text-base leading-relaxed">{post.content}</p></div>
                    ) : (
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-300 mb-1">Internal Notes</label><textarea rows={5} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                            <div><label className="block text-sm font-medium text-gray-300 mb-1">Client Feedback</label><textarea rows={5} value={clientFeedback} onChange={e => setClientFeedback(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                            <button onClick={handleNotesSave} className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">Save Notes</button>
                        </div>
                    )}
                 </div>
                {post.generationOptions?.research && (
                    <details className="group pt-2">
                        <summary className="cursor-pointer list-none"><h3 className="text-sm font-semibold text-gray-400 flex justify-between items-center"><span>AI Research Report</span><span className="text-teal-400 transition-transform transform group-open:rotate-180">▼</span></h3></summary>
                        <div className="mt-2 bg-gray-900/50 p-3 rounded-md text-sm space-y-2"><p><span className="font-semibold text-gray-400">Sentiment:</span> <span className="font-bold text-teal-300">{post.generationOptions.research.sentiment}</span></p><p className="text-gray-300"><span className="font-semibold text-gray-400">Summary:</span> {post.generationOptions.research.summary}</p><div><h4 className="font-semibold text-gray-400">Keywords Used:</h4><p className="text-xs text-gray-300">{post.generationOptions.research.keywordsToInclude.join(', ')}</p></div></div>
                    </details>
                )}
                 {isRepurposing ? (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Repurpose for other platforms</h3>
                        <div className="bg-gray-900/50 p-3 rounded-md"><p className="text-xs text-gray-400 mb-3">Select new platforms to generate similar content for, using the original settings.</p><div className="grid grid-cols-2 gap-2">{availablePlatforms.map(platform => (<button key={platform} type="button" onClick={() => handlePlatformToggle(platform)} className={`text-sm py-1.5 px-3 rounded-md transition-colors duration-200 ${repurposePlatforms.includes(platform) ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{platform}</button>))}</div><button onClick={handleRepurposeSubmit} className="w-full flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 mt-4 text-sm"><SparklesIcon className="h-5 w-5" /> Generate</button></div>
                    </div>
                 ) : null}
                <div className="flex flex-wrap gap-4 text-sm pt-2">
                    {post.category && (<div><h4 className="font-semibold text-gray-400">Category</h4><p className="text-teal-300">{post.category}</p></div>)}
                    <div><h4 className="font-semibold text-gray-400">Created</h4><p className="text-gray-300">{new Date(post.createdAt).toLocaleString()}</p></div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between p-4 bg-gray-700/50 border-t border-gray-700 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Status:</span>
            <select value={post.status} onChange={(e) => onUpdatePost(post.id, {status: e.target.value as PostStatus})} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                {Object.values(PostStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {post.generationOptions && (
                 <button onClick={() => setIsRepurposing(!isRepurposing)} title="Repurpose" className={`p-2 flex items-center gap-2 text-sm rounded-md transition-colors ${isRepurposing ? 'bg-teal-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    <SparklesIcon className="h-5 w-5" /> {isRepurposing ? 'Cancel' : 'Repurpose'}
                </button>
            )}
            <button onClick={() => onDownload(post)} title="Download" className="p-2 flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                <DownloadIcon className="h-5 w-5" /> Download
            </button>
            <button onClick={() => onSendToN8n(post)} title="Send to n8n" className="p-2 flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                <ShareIcon className="h-5 w-5" /> Send to n8n
            </button>
            <button onClick={handleDelete} title="Delete" className="p-2 flex items-center gap-2 text-sm bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md transition-colors">
                <TrashIcon className="h-5 w-5" /> Delete
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};