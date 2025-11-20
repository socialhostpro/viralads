

import React, { useState, useMemo, useEffect } from 'react';
import type { Platform, GenerationOptions, GenerationState, Post, Project, Client, ResearchReport } from '../types';
import { ALL_PLATFORMS, findBestUrlForTopic, performResearch } from '../services/geminiService';
import { Spinner } from './Spinner';
import { WandIcon, SearchIcon, SparklesIcon } from './Icons';


interface ControlPanelProps {
  posts: Post[];
  onGenerate: (options: GenerationOptions) => void;
  generationState: GenerationState;
  n8nWebhookUrl: string;
  setN8nWebhookUrl: (url: string) => void;
  projects: Project[];
  clients: Client[];
  onCreateProject: (projectData: Omit<Project, 'id'>) => void;
  onManageProjects: () => void;
}

const TONE_OPTIONS = ['Viral & Engaging', 'Professional', 'Witty', 'Casual', 'Formal', 'Inspirational'];
const AUDIENCE_OPTIONS = ['Gen Z', 'Millennials', 'Professionals', 'Small Business Owners', 'Parents', 'Tech Enthusiasts'];
const IMAGE_MODELS = ['imagen-4.0-generate-001', 'gemini-2.5-flash-image'];
const VIDEO_MODELS = ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'];

export const ControlPanel: React.FC<ControlPanelProps> = ({ posts, onGenerate, generationState, n8nWebhookUrl, setN8nWebhookUrl, projects, clients, onCreateProject, onManageProjects }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [topic, setTopic] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('Viral & Engaging');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [includeImage, setIncludeImage] = useState(false);
  const [includeVideo, setIncludeVideo] = useState(false);
  const [useTrendingTopics, setUseTrendingTopics] = useState(false);
  const [category, setCategory] = useState('');
  
  // Advanced Options
  const [keywordsToInclude, setKeywordsToInclude] = useState('');
  const [keywordsToExclude, setKeywordsToExclude] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0]);
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0]);
  const [musicPrompt, setMusicPrompt] = useState('');
  const [sfxPrompt, setSfxPrompt] = useState('');

  // New features state
  const [alwaysIncludeClientName, setAlwaysIncludeClientName] = useState(false);
  const [isFindingUrl, setIsFindingUrl] = useState(false);
  
  // Research state
  const [isResearching, setIsResearching] = useState(false);
  const [research, setResearch] = useState<ResearchReport | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);


  const uniqueCategories = useMemo(() => {
    const categories = new Set(posts.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(categories);
  }, [posts]);

  const clientProjects = useMemo(() => {
    return selectedClientId ? projects.filter(p => p.clientId === selectedClientId) : [];
  }, [projects, selectedClientId]);

  // Reset project selection if client changes
  useEffect(() => {
    setSelectedProjectId('');
  }, [selectedClientId]);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedPlatforms.length === ALL_PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(ALL_PLATFORMS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
        (window as any).alert("Please select a client.");
        return;
    }
    if (!topic && !sourceUrl) {
        (window as any).alert("Please provide a topic and/or a source URL.");
        return;
    }
    if (selectedPlatforms.length === 0) {
        (window as any).alert("Please select at least one platform.");
        return;
    }

    let finalKeywordsToInclude = keywordsToInclude;
    if (alwaysIncludeClientName && selectedClientId) {
        const clientName = clients.find(c => c.id === selectedClientId)?.name;
        if (clientName) {
            const keywordSet = new Set(keywordsToInclude.split(',').map(k => k.trim().toLowerCase()).filter(Boolean));
            if (!keywordSet.has(clientName.toLowerCase())) {
                finalKeywordsToInclude = keywordsToInclude ? `${keywordsToInclude}, ${clientName}` : clientName;
            }
        }
    }

    onGenerate({ 
        clientId: selectedClientId,
        topic, sourceUrl, targetAudience, tone, platforms: selectedPlatforms, 
        includeImage, includeVideo, useTrendingTopics, category, 
        keywordsToInclude: finalKeywordsToInclude, 
        keywordsToExclude, negativePrompt,
        imageModel, videoModel, musicPrompt, sfxPrompt,
        research: research || undefined
    });
  };
  
  const handleLoadProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (!projectId) {
      setTopic(''); setSourceUrl(''); setTargetAudience(''); setTone('Viral & Engaging');
      setCategory(''); setKeywordsToInclude(''); setKeywordsToExclude(''); setNegativePrompt('');
      setSfxPrompt('');
      setResearch(null);
      setTrendingTopics([]);
      return;
    }
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setTopic(project.topic);
      setSourceUrl(project.sourceUrl || '');
      setTargetAudience(project.targetAudience);
      setTone(project.tone);
      setCategory(project.category);
      setKeywordsToInclude(project.keywordsToInclude);
      setKeywordsToExclude(project.keywordsToExclude);
      setNegativePrompt(project.negativePrompt);
      setSfxPrompt(project.sfxPrompt || '');
      setResearch(project.research || null);
      setTrendingTopics(project.research?.trendingTopics || []);
    }
  };

  const handleSaveAsProject = () => {
     if (!selectedClientId) {
        (window as any).alert("Please select a client before saving a project.");
        return;
    }
    const name = (window as any).prompt("Enter a name for this project:");
    if (name) {
      onCreateProject({
        name,
        clientId: selectedClientId,
        topic, sourceUrl, targetAudience, tone, category,
        keywordsToInclude, keywordsToExclude, negativePrompt, sfxPrompt,
        research: research || undefined,
      });
      (window as any).alert(`Project "${name}" saved!`);
    }
  };

  const handleFindUrl = async () => {
    if (!topic) {
        (window as any).alert("Please provide a topic to find a relevant URL.");
        return;
    }
    setIsFindingUrl(true);
    try {
        const url = await findBestUrlForTopic(topic);
        setSourceUrl(url);
    } catch(error) {
        (window as any).alert(error instanceof Error ? error.message : "An unknown error occurred while finding a URL.");
        console.error("URL finding failed:", error);
    } finally {
        setIsFindingUrl(false);
    }
  };
  
  const handleResearch = async () => {
    if (!topic && !sourceUrl) {
        (window as any).alert('Please provide a Topic or a Source URL to start research.');
        return;
    }
    setIsResearching(true);
    setResearch(null);
    setTrendingTopics([]);
    try {
        const report = await performResearch(topic, sourceUrl);
        setResearch(report);
        setKeywordsToInclude(report.keywordsToInclude.join(', '));
        setKeywordsToExclude(report.keywordsToExclude.join(', '));
        setNegativePrompt(report.negativePrompt);
        setSfxPrompt(report.sfxPrompt || '');
        setTrendingTopics(report.trendingTopics || []);
    } catch(error) {
        (window as any).alert(error instanceof Error ? error.message : "An unknown error occurred during research.");
        console.error(error);
    } finally {
        setIsResearching(false);
    }
  };
  
   const handleAddKeyword = (keyword: string) => {
        setKeywordsToInclude(prev => {
            const currentKeywords = prev.split(',').map(k => k.trim()).filter(Boolean);
            const lowerCaseKeywords = currentKeywords.map(k => k.toLowerCase());
            if (lowerCaseKeywords.includes(keyword.toLowerCase())) {
                return prev;
            }
            return [...currentKeywords, keyword].join(', ');
        });
    };

  const isLoading = generationState.status === 'LOADING';

  return (
    <div className="bg-gray-800 rounded-lg p-6 sticky top-24 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Content Generator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <div className="flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="client" className="block text-sm font-medium text-gray-300 mb-1">Client</label>
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <select id="client" value={selectedClientId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClientId(e.currentTarget.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="" disabled>-- Select a Client --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300 pb-2 whitespace-nowrap">
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <input type="checkbox" checked={alwaysIncludeClientName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlwaysIncludeClientName(e.currentTarget.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500"/>
                    <span>Include in Content</span>
                </label>
            </div>
        </div>

        <div className={`bg-gray-900/50 p-4 rounded-lg ring-1 ring-gray-700 transition-opacity ${!selectedClientId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-base font-bold text-gray-200 mb-3">Project</h3>
          <div className="space-y-3">
            <select
              value={selectedProjectId}
              // FIX: Use e.currentTarget instead of e.target to ensure correct type inference.
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLoadProject(e.currentTarget.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              aria-label="Load a project"
              disabled={!selectedClientId}
            >
              <option value="">-- Load a project --</option>
              {clientProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={handleSaveAsProject} disabled={!selectedClientId} className="flex-1 bg-teal-800 hover:bg-teal-700 disabled:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition-colors">Save as Project</button>
              <button type="button" onClick={onManageProjects} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md transition-colors">Manage Projects</button>
            </div>
          </div>
        </div>

        <fieldset disabled={!selectedClientId} className="space-y-6 disabled:opacity-50">
            <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">Topic / Product / Person</label>
            {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
            <input id="topic" value={topic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.currentTarget.value)} placeholder="e.g., Sustainable Coffee Beans" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-300">Source URL for Context (Optional)</label>
                <button type="button" onClick={handleFindUrl} disabled={!topic || isFindingUrl} className="flex items-center gap-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-1 px-2 rounded-md transition-colors">
                  {isFindingUrl ? <Spinner /> : <SearchIcon className="h-3 w-3"/>}
                  {isFindingUrl ? 'Finding...' : 'Find Best URL'}
                </button>
              </div>
              {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
              <input id="sourceUrl" type="url" value={sourceUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceUrl(e.currentTarget.value)} placeholder="https://example.com/product-page" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3 ring-1 ring-gray-700">
                <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-gray-200">AI-Powered Strategy</h4>
                    <button type="button" onClick={handleResearch} disabled={isResearching || (!topic && !sourceUrl)} className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 disabled:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors">
                        {isResearching ? <Spinner /> : <SparklesIcon className="h-4 w-4" />}
                        {isResearching ? 'Researching...' : 'Research & Suggest'}
                    </button>
                </div>
                {research && (
                    <div className="border-t border-gray-600 pt-3 space-y-3 text-sm">
                        <p><span className="font-semibold text-gray-400">Sentiment:</span> <span className="font-bold text-teal-300">{research.sentiment}</span></p>
                        <p className="text-gray-300"><span className="font-semibold text-gray-400">Summary:</span> {research.summary}</p>
                        {trendingTopics.length > 0 && (
                            <div>
                                <p className="font-semibold text-gray-400 mb-1.5">Trending Topics (click to add as keyword):</p>
                                <div className="flex flex-wrap gap-2">
                                    {trendingTopics.map((topic, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleAddKeyword(topic)}
                                            className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium py-1 px-2.5 rounded-full transition-colors"
                                        >
                                            + {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
            {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
            <input list="audience-options" id="audience" value={targetAudience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.currentTarget.value)} placeholder="e.g., Eco-conscious millennials" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            <datalist id="audience-options">
                {AUDIENCE_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
            </div>
            <div>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">Tone of Voice</label>
            {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
            <input list="tone-options" id="tone" value={tone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTone(e.currentTarget.value)} placeholder="e.g., Professional, Witty, Casual" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            <datalist id="tone-options">
                {TONE_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
            </div>
            <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category (Optional)</label>
            {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
            <input list="category-options" id="category" value={category} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.currentTarget.value)} placeholder="e.g., Q3 Campaign" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            <datalist id="category-options">
                {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            </div>
            
            <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Platforms</h3>
            <div className="mb-2"><button type="button" onClick={handleSelectAll} className="text-xs text-teal-400 hover:text-teal-300">{selectedPlatforms.length === ALL_PLATFORMS.length ? 'Deselect All' : 'Select All'}</button></div>
            <div className="grid grid-cols-2 gap-2">{ALL_PLATFORMS.map(platform => (<button key={platform} type="button" onClick={() => handlePlatformToggle(platform)} className={`text-sm py-1.5 px-3 rounded-md transition-colors duration-200 ${selectedPlatforms.includes(platform) ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{platform}</button>))}</div>
            </div>
            
            <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Enhancements</h3>
            <div className="space-y-2">
                {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={includeImage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeImage(e.currentTarget.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500"/><span>Include Image</span></label>
                <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                        <input type="checkbox" checked={includeVideo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeVideo(e.currentTarget.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500"/>
                        <span>Include Video</span>
                    </label>
                    <p className="text-xs text-gray-500 pl-6">Requires a personal API key.</p>
                </div>
                {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={useTrendingTopics} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseTrendingTopics(e.currentTarget.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500"/><span>Use Trending Topics</span></label>
            </div>
            </div>

            <details className="group border-t border-gray-700 pt-4">
                <summary className="cursor-pointer list-none"><div className="flex justify-between items-center"><h3 className="text-sm font-medium text-gray-300">Advanced Options</h3><span className="text-teal-400 transition-transform transform group-open:rotate-180">▼</span></div></summary>
                <div className="mt-4 space-y-4">
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <div><label htmlFor="keywordsToInclude" className="block text-sm font-medium text-gray-300 mb-1">Keywords to Include</label><input id="keywordsToInclude" value={keywordsToInclude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywordsToInclude(e.currentTarget.value)} placeholder="e.g., sustainable, organic" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <div><label htmlFor="keywordsToExclude" className="block text-sm font-medium text-gray-300 mb-1">Keywords to Exclude</label><input id="keywordsToExclude" value={keywordsToExclude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywordsToExclude(e.currentTarget.value)} placeholder="e.g., cheap, artificial" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    <div><label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-300 mb-1">Negative Prompt</label><textarea id="negativePrompt" rows={2} value={negativePrompt} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNegativePrompt(e.currentTarget.value)} placeholder="e.g., Avoid cliches, don't mention competitors" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    {includeImage && <div><label htmlFor="imageModel" className="block text-sm font-medium text-gray-300 mb-1">Image Model</label><select id="imageModel" value={imageModel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImageModel(e.currentTarget.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">{IMAGE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>}
                    {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                    {includeVideo && <><div><label htmlFor="videoModel" className="block text-sm font-medium text-gray-300 mb-1">Video Model</label><select id="videoModel" value={videoModel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVideoModel(e.currentTarget.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">{VIDEO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}</select></div><div><label htmlFor="musicPrompt" className="block text-sm font-medium text-gray-300 mb-1">Music Prompt</label><input id="musicPrompt" value={musicPrompt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMusicPrompt(e.currentTarget.value)} placeholder="e.g., Upbeat electronic synthwave" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div><div><label htmlFor="sfxPrompt" className="block text-sm font-medium text-gray-300 mb-1">Sound Effects Prompt</label><input id="sfxPrompt" value={sfxPrompt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSfxPrompt(e.currentTarget.value)} placeholder="e.g., Whoosh, subtle clicks, a gentle hum" className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div></>}
                    <div>
                        <label htmlFor="n8n" className="block text-sm font-medium text-gray-300 mb-1">n8n Webhook URL (Optional)</label>
                        {/* FIX: Use e.currentTarget instead of e.target to ensure correct type inference. */}
                        <input id="n8n" value={n8nWebhookUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setN8nWebhookUrl(e.currentTarget.value)} type="url" placeholder="https://your-n8n-instance.com/webhook/..." className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                    </div>
                </div>
            </details>
        </fieldset>

        <button type="submit" disabled={isLoading || !selectedClientId} className="w-full flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200">
          {isLoading ? <Spinner /> : <WandIcon className="h-5 w-5" />}
          {isLoading ? 'Generating...' : 'Generate Content'}
        </button>
        {generationState.status !== 'IDLE' && (
           <p className={`text-sm text-center mt-2 ${generationState.status === 'ERROR' ? 'text-red-400' : 'text-gray-400'}`}>{generationState.message}</p>
        )}
      </form>
    </div>
  );
};
