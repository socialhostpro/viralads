import React, { useState, useMemo } from 'react';
import { Post, Platform, PostStatus, Client, ClientStatus, ApiKeys } from '../types';
import { PostCard } from './PostCard';
import { PostDetailModal } from './PostDetailModal';
import { CollectionIcon, SearchIcon, ShareIcon, TrashIcon } from './Icons';
import { ALL_PLATFORMS } from '../services/geminiService';

interface ContentLibraryProps {
  posts: Post[];
  clients: Client[];
  onDelete: (id: string) => void;
  onDownload: (post: Post) => void;
  onSendToN8n: (post: Post) => void;
  onUpdatePost: (postId: string, update: Partial<Post>) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdateStatus: (ids: string[], status: PostStatus) => void;
  onBulkSendToN8n: (ids: string[]) => void;
  onRepurpose: (sourcePost: Post, targetPlatforms: Platform[]) => void;
  apiKeys?: ApiKeys;
}

const ALL_STATUSES = Object.values(PostStatus);
const ALL_CLIENT_STATUSES = Object.values(ClientStatus);

export const ContentLibrary: React.FC<ContentLibraryProps> = ({ 
    posts, clients, onDelete, onDownload, onSendToN8n, onUpdatePost, 
    onBulkDelete, onBulkUpdateStatus, onBulkSendToN8n, onRepurpose,
    apiKeys
}) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClientFilter, setActiveClientFilter] = useState<string>('');
  const [activePlatformFilters, setActivePlatformFilters] = useState<Platform[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<PostStatus[]>([]);
  const [activeClientStatusFilter, setActiveClientStatusFilter] = useState<ClientStatus | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'platform'>('createdAt_desc');
  
  const clientMap = React.useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const handlePlatformFilterToggle = (platform: Platform) => {
    setActivePlatformFilters(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleStatusFilterToggle = (status: PostStatus) => {
    setActiveStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  
  const handleSelectPost = (postId: string) => {
    setSelectedPostIds(prev =>
        prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleBulkDelete = () => {
    if((window as any).confirm(`Are you sure you want to delete ${selectedPostIds.length} posts?`)) {
        onBulkDelete(selectedPostIds);
        setSelectedPostIds([]);
    }
  }

  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Use e.currentTarget instead of e.target to ensure correct type inference.
    const status = e.currentTarget.value as PostStatus;
    if (status) {
        onBulkUpdateStatus(selectedPostIds, status);
        setSelectedPostIds([]);
    }
  }

  const filteredAndSortedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      switch (sortBy) {
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'platform':
          return a.platform.localeCompare(b.platform);
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted.filter(post => {
      const searchMatch =
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.category && post.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const clientMatch = !activeClientFilter || post.clientId === activeClientFilter;
      const platformMatch = activePlatformFilters.length === 0 || activePlatformFilters.includes(post.platform);
      const statusMatch = activeStatusFilters.length === 0 || activeStatusFilters.includes(post.status);
      const clientStatusMatch = !activeClientStatusFilter || post.clientStatus === activeClientStatusFilter;

      return searchMatch && clientMatch && platformMatch && statusMatch && clientStatusMatch;
    });
  }, [posts, searchQuery, sortBy, activeClientFilter, activePlatformFilters, activeStatusFilters, activeClientStatusFilter]);
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 shadow-inner flex flex-col h-full">
        {/* Header */}
        <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Content Library / Portfolio</h2>
            <div className="mt-4 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <input type="text" placeholder="Search content or category..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.currentTarget.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 pl-10 pr-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                </div>
                <div className="flex gap-4">
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <select value={activeClientFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActiveClientFilter(e.currentTarget.value)} className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                     {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <select value={activeClientStatusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActiveClientStatusFilter(e.currentTarget.value as ClientStatus | '')} className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="">All Client Statuses</option>
                        {ALL_CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <select value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.currentTarget.value as any)} className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="createdAt_desc">Newest First</option>
                        <option value="createdAt_asc">Oldest First</option>
                        <option value="platform">By Platform</option>
                    </select>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div><span className="text-sm font-medium text-gray-400 mr-3">Platforms:</span>{ALL_PLATFORMS.map(p => (<button key={p} onClick={() => handlePlatformFilterToggle(p)} className={`text-xs mr-2 mb-2 py-1 px-2.5 rounded-full transition-colors duration-200 ${activePlatformFilters.includes(p) ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{p}</button>))}</div>
                <div><span className="text-sm font-medium text-gray-400 mr-3">Status:</span>{ALL_STATUSES.map(s => (<button key={s} onClick={() => handleStatusFilterToggle(s)} className={`text-xs mr-2 mb-2 py-1 px-2.5 rounded-full transition-colors duration-200 ${activeStatusFilters.includes(s) ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{s}</button>))}</div>
            </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPostIds.length > 0 && (
            <div className="mb-4 bg-gray-700/50 p-3 rounded-lg flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-white">{selectedPostIds.length} post{selectedPostIds.length > 1 ? 's' : ''} selected</p>
                <div className="flex items-center gap-2">
                    <select onChange={handleBulkStatusChange} value="" className="text-xs bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                        <option value="" disabled>Change status...</option>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => onBulkSendToN8n(selectedPostIds)} title="Send to n8n" className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"><ShareIcon className="h-4 w-4" /></button>
                    <button onClick={handleBulkDelete} title="Delete" className="p-1.5 bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md transition-colors"><TrashIcon className="h-4 w-4" /></button>
                    <button onClick={() => setSelectedPostIds([])} className="text-xs text-teal-400 hover:text-teal-300 ml-2">Clear</button>
                </div>
            </div>
        )}
      
        {/* Content Grid */}
        {filteredAndSortedPosts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg flex-grow flex flex-col justify-center">
            <CollectionIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-400">{posts.length > 0 ? "No matching posts found" : "No content yet"}</h3>
            <p className="mt-1 text-sm text-gray-500">{posts.length > 0 ? "Try adjusting your search or filters." : "Use the generator to create your first post."}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 flex-grow">
            {filteredAndSortedPosts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post}
                    clientName={clientMap.get(post.clientId)} 
                    onClick={() => setSelectedPost(post)}
                    onSelect={handleSelectPost}
                    isSelected={selectedPostIds.includes(post.id)}
                    apiKeys={apiKeys}
                />
            ))}
            </div>
        )}

        {/* Modal */}
        {selectedPost && (
            <PostDetailModal
                post={selectedPost}
                clientName={clientMap.get(selectedPost.clientId)}
                onClose={() => setSelectedPost(null)}
                onDelete={onDelete}
                onDownload={onDownload}
                onSendToN8n={onSendToN8n}
                onUpdatePost={onUpdatePost}
                onRepurpose={onRepurpose}
                apiKeys={apiKeys}
            />
        )}
    </div>
  );
};