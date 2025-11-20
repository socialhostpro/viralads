import React, { useState, useEffect } from 'react';
import { Post, ClientStatus } from '../types';
import { LogoIcon, CheckCircleIcon } from './Icons';
import { Spinner } from './Spinner';

interface ProofingViewProps {
    shareId: string;
    findPost: (shareId: string) => { userEmail: string, post: Post, clientName?: string } | null;
    updatePost: (shareId: string, update: Partial<Post>) => void;
}

type ViewStatus = 'LOADING' | 'NOT_FOUND' | 'FOUND' | 'SUBMITTED';

export const ProofingView: React.FC<ProofingViewProps> = ({ shareId, findPost, updatePost }) => {
    const [status, setStatus] = useState<ViewStatus>('LOADING');
    const [postData, setPostData] = useState<{ post: Post, clientName?: string } | null>(null);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const data = findPost(shareId);
        if (data) {
            setPostData(data);
            setStatus('FOUND');
        } else {
            setStatus('NOT_FOUND');
        }
    }, [shareId, findPost]);

    const handleSubmit = (newStatus: ClientStatus.Approved | ClientStatus.Revisions) => {
        if (!postData) return;
        
        const updates: Partial<Post> = {
            clientStatus: newStatus,
            lastClientUpdate: new Date().toISOString(),
        };

        if (feedback) {
            updates.clientFeedback = `${postData.post.clientFeedback || ''}\n\n--- ${new Date().toLocaleString()} ---\n${feedback}`.trim();
        }
        
        updatePost(shareId, updates);
        setStatus('SUBMITTED');
    };

    if (status === 'LOADING') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Spinner />
                <p className="ml-4">Loading content for review...</p>
            </div>
        );
    }
    
    if (status === 'NOT_FOUND') {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
                 <div className="flex items-center gap-3 mb-4">
                    <LogoIcon className="h-8 w-8 text-teal-400" />
                    <h1 className="text-2xl font-bold tracking-tight text-white">Viral Content AI Studio</h1>
                </div>
                <h2 className="text-2xl font-bold text-red-400">Content Not Found</h2>
                <p className="text-gray-400 mt-2">The link you used may be invalid or the content may have been removed. Please check the URL and try again.</p>
            </div>
        );
    }

    if (!postData) return null; // Should be covered by above states
    
    const { post, clientName } = postData;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
            <header className="max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <LogoIcon className="h-8 w-8 text-teal-400" />
                    <h1 className="text-2xl font-bold tracking-tight text-white">Content for Review</h1>
                </div>
                {clientName && <p className="text-gray-400">For: {clientName}</p>}
            </header>
            
            <main className="max-w-4xl mx-auto mt-6">
                <div className="bg-gray-800/50 rounded-lg shadow-lg p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column (Media) */}
                        <div className="space-y-4">
                            {post.imageUrl && (<img src={post.imageUrl} alt="Generated media" className="rounded-md w-full aspect-square object-cover" />)}
                            {post.videoUrl && post.videoUrl !== 'GENERATING' && post.videoUrl !== 'FAILED' && (<video controls src={post.videoUrl} className="rounded-md w-full aspect-video" />)}
                        </div>
                        {/* Right Column (Content) */}
                        <div>
                             <h3 className="text-lg font-bold text-teal-400 mb-2">{post.platform} Post</h3>
                             <div className="bg-gray-900/50 p-4 rounded-md max-h-[60vh] overflow-y-auto">
                                <p className="text-gray-300 whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {status === 'SUBMITTED' ? (
                    <div className="mt-6 bg-gray-800/50 rounded-lg p-8 text-center">
                        <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-white mt-4">Thank You!</h2>
                        <p className="text-gray-300 mt-2">Your feedback has been submitted successfully.</p>
                    </div>
                ) : (
                    <div className="mt-6 bg-gray-800/50 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Provide Feedback</h2>
                        <div>
                            <label htmlFor="feedback" className="block text-sm font-medium text-gray-300 mb-1">Comments or revision requests (optional)</label>
                            <textarea
                                id="feedback"
                                rows={4}
                                value={feedback}
                                onChange={e => setFeedback(e.currentTarget.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                placeholder="e.g., 'Please change the third sentence to be more direct...'"
                            />
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => handleSubmit(ClientStatus.Revisions)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
                            >
                                Request Revisions
                            </button>
                             <button 
                                onClick={() => handleSubmit(ClientStatus.Approved)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
                            >
                                Approve Content
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};