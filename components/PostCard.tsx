import React, { useRef, useState, useEffect } from 'react';
import { type Post, Platform, PostStatus, ClientStatus, ApiKeys } from '../types';
import {
  BlogIcon, InstagramIcon, FacebookIcon, XIcon, TikTokIcon,
  BlueskyIcon, LinkedInIcon, PressReleaseIcon, PlayIcon,
  YouTubeIcon, PodcastIcon,
  ClockIcon
} from './Icons';
import { Spinner } from './Spinner';
import { fetchVideoWithApiKey } from '../services/geminiService';

interface PostCardProps {
  post: Post;
  clientName?: string;
  onClick: (post: Post) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  apiKeys?: ApiKeys;
}

const platformAssets: Record<Platform, { icon: React.ElementType, style: string }> = {
  [Platform.Blog]: { icon: BlogIcon, style: 'bg-orange-500' },
  [Platform.Instagram]: { icon: InstagramIcon, style: 'bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500' },
  [Platform.Facebook]: { icon: FacebookIcon, style: 'bg-blue-600' },
  [Platform.X]: { icon: XIcon, style: 'bg-black' },
  [Platform.TikTok]: { icon: TikTokIcon, style: 'bg-black' },
  [Platform.Bluesky]: { icon: BlueskyIcon, style: 'bg-blue-500' },
  [Platform.LinkedIn]: { icon: LinkedInIcon, style: 'bg-sky-700' },
  [Platform.PressRelease]: { icon: PressReleaseIcon, style: 'bg-gray-500' },
  [Platform.YouTube]: { icon: YouTubeIcon, style: 'bg-red-600' },
  [Platform.Podcast]: { icon: PodcastIcon, style: 'bg-purple-600' },
};

const statusColors: Record<PostStatus, string> = {
    [PostStatus.Draft]: 'text-yellow-400',
    [PostStatus.ForReview]: 'text-cyan-400',
    [PostStatus.Scheduled]: 'text-blue-400',
    [PostStatus.Approved]: 'text-lime-400',
    [PostStatus.Published]: 'text-green-400',
    [PostStatus.Archived]: 'text-gray-400',
};

const clientStatusIndicator: Record<ClientStatus, { color: string; label: string }> = {
    [ClientStatus.Pending]: { color: 'bg-yellow-400', label: 'Pending Client Approval' },
    [ClientStatus.Revisions]: { color: 'bg-orange-400', label: 'Client Revisions Requested' },
    [ClientStatus.Approved]: { color: 'bg-green-400', label: 'Client Approved' },
};


export const PostCard: React.FC<PostCardProps> = ({ post, clientName, onClick, onSelect, isSelected, apiKeys }) => {
  const { icon: PlatformIcon, style: platformStyle } = platformAssets[post.platform];
  const hasMedia = post.imageUrl || post.videoUrl;
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);
  const [videoFetchFailed, setVideoFetchFailed] = useState(false);

  const videoApiUrl = (post.videoUrl && post.videoUrl.startsWith('https://')) ? post.videoUrl : undefined;

  useEffect(() => {
    let isCancelled = false;
    let currentObjectUrl: string | null = null;

    const fetchVideo = async () => {
        if (!videoApiUrl) {
            setVideoObjectUrl(null);
            setIsFetchingVideo(false);
            return;
        }
        setIsFetchingVideo(true);
        setVideoFetchFailed(false);
        try {
            const blob = await fetchVideoWithApiKey(videoApiUrl, apiKeys);
            if (!isCancelled) {
                currentObjectUrl = URL.createObjectURL(blob);
                setVideoObjectUrl(currentObjectUrl);
            }
        } catch (e) {
            console.error("Failed to load video for card", e);
            if (!isCancelled) {
                setVideoFetchFailed(true);
            }
        } finally {
            if (!isCancelled) {
                setIsFetchingVideo(false);
            }
        }
    };

    fetchVideo();

    return () => {
        isCancelled = true;
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
        }
    };
  }, [videoApiUrl, apiKeys]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const checkClamping = () => {
      // FIX: Properties 'scrollHeight' and 'clientHeight' may not exist on type 'HTMLParagraphElement' in some TS configs. Cast to 'any' to bypass.
      if ((element as any).scrollHeight > (element as any).clientHeight) {
        setIsClamped(true);
      } else {
        setIsClamped(false);
      }
    };
    
    const timeoutId = setTimeout(checkClamping, 100);
    // FIX: Property 'addEventListener' does not exist on type 'Window'. Cast window to 'any' to bypass the type error.
    (window as any).addEventListener('resize', checkClamping);

    return () => {
        clearTimeout(timeoutId);
        // FIX: Property 'removeEventListener' does not exist on type 'Window'. Cast window to 'any' to bypass the type error.
        (window as any).removeEventListener('resize', checkClamping);
    };
  }, [post.content]);
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(post.id);
  }

  return (
    <div className="relative">
        <button 
            onClick={() => onClick(post)} 
            className={`relative aspect-[4/5] w-full bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-teal-500/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 ${isSelected ? 'ring-2 ring-teal-500 scale-105' : ''}`}
            aria-label={`View details for ${post.platform} post`}
            >
            {/* Media Background */}
            {videoObjectUrl ? (
                 <video 
                    key={post.id}
                    src={videoObjectUrl} 
                    poster={post.imageUrl}
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-contain bg-black" 
                />
            ) : post.imageUrl ? (
                <img src={post.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : null}

            {/* Generating State */}
            {(isFetchingVideo || post.videoUrl === 'GENERATING') && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                    {post.imageUrl && (
                        <img src={post.imageUrl} alt="Generating..." className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                        <Spinner />
                        <p className="text-sm font-semibold text-white mt-2 drop-shadow-md">{isFetchingVideo ? "Loading video..." : "Generating video..."}</p>
                    </div>
                </div>
            )}
            
            {/* Failed State */}
            {(post.videoUrl === 'FAILED' || videoFetchFailed) && (
                 <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center p-4 text-center">
                    {post.imageUrl && (
                        <img src={post.imageUrl} alt="Failed" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                        <svg className="h-8 w-8 text-red-400 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-red-200 mt-2 drop-shadow-md">
                            {post.videoUrl === 'FAILED' ? 'Video generation failed.' : 'Could not load video.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Overlay */}
            <div className={`absolute inset-0 ${hasMedia ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent' : ''}`}></div>
            
            {/* Unified Content and Footer */}
            <div className="relative p-4 text-white z-10 text-left flex flex-col h-full">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full self-start ${platformStyle}`}>
                        <PlatformIcon className="h-6 w-6 text-white" />
                    </div>
                    {post.clientStatus && (
                         <div
                            title={clientStatusIndicator[post.clientStatus].label}
                            className={`h-3 w-3 rounded-full ${clientStatusIndicator[post.clientStatus].color}`}
                         />
                    )}
                </div>
                
                <div className="mt-auto">
                    <p ref={contentRef} className={`whitespace-pre-wrap text-sm leading-relaxed ${hasMedia ? 'text-white line-clamp-4' : 'text-gray-300 line-clamp-6'}`}>{post.content}</p>
                    {isClamped && <span className="text-teal-400 font-semibold text-sm">...read more</span>}
                    <h3 className="font-bold text-lg mt-2">{post.platform}</h3>
                    {clientName && <p className="text-xs text-gray-300">{clientName}</p>}
                    <div className="flex items-center gap-2 mt-1">
                        {post.category && <p className="text-xs text-teal-300 bg-teal-900/50 inline-block px-2 py-0.5 rounded-full">{post.category}</p>}
                        <p className={`text-xs font-semibold ${statusColors[post.status]}`}>{post.status}</p>
                    </div>
                    {post.status === PostStatus.Scheduled && post.scheduledAt && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-300 bg-blue-900/50 inline-flex px-2 py-0.5 rounded-full">
                           <ClockIcon className="h-3 w-3" />
                           <span>{new Date(post.scheduledAt).toLocaleDateString()} {new Date(post.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                 {post.videoUrl && post.videoUrl !== 'GENERATING' && post.videoUrl !== 'FAILED' ? (
                    <PlayIcon className="h-12 w-12 text-white/90 drop-shadow-lg" />
                ) : (
                    <p className="font-bold text-white">View Details</p>
                )}
            </div>
        </button>
         {/* Selection Checkbox */}
        <div className="absolute top-2 right-2 z-20">
            <input 
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                onClick={e => e.stopPropagation()}
                className="h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-teal-500 focus:ring-teal-500 cursor-pointer"
                aria-label={`Select post for ${post.platform}`}
            />
        </div>
    </div>
  );
};