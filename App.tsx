
import React, { useState, useCallback, useEffect } from 'react';
import { Post, GenerationOptions, GenerationState, PostStatus, Platform, Project, ResearchReport, User, UserSettings, Client } from './types';
import { ControlPanel } from './components/ControlPanel';
import { ContentLibrary } from './components/ContentLibrary';
import { generateContentForAllPlatforms, performResearch } from './services/geminiService';
import { downloadFile } from './utils/fileUtils';
import { CloseIcon, EditIcon, GridIcon, ListIcon, LogoIcon, LogoutIcon, SettingsIcon, TrashIcon, WalletIcon, WandIcon, SparklesIcon, BriefcaseIcon } from './components/Icons';
import { Spinner } from './components/Spinner';
import { SettingsModal } from './components/SettingsModal';
import { WalletModal } from './components/WalletModal';
import { ClientManagerModal } from './components/ClientManagerModal';

const TONE_OPTIONS = ['Viral & Engaging', 'Professional', 'Witty', 'Casual', 'Formal', 'Inspirational'];

// --- API KEY MODAL COMPONENT ---
interface ApiKeyModalProps {
    onClose: () => void;
    onSelectKey: () => void;
}
const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSelectKey }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">API Key Required for Video Generation</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <main className="p-6 space-y-4 text-gray-300">
                    <p>The Veo video generation model requires you to use your own Google AI Studio API key.</p>
                    <p>Video generation is a premium feature and its usage will be billed directly to your Google Cloud project.</p>
                    <p>For more information on billing, please visit the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">official documentation</a>.</p>
                </main>
                <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                    <button type="button" onClick={onSelectKey} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Select API Key</button>
                </footer>
            </div>
        </div>
    );
};


// --- MISSING CUSTOM KEY MODAL COMPONENT ---
interface MissingCustomKeyModalProps {
    onClose: () => void;
    onOpenSettings: () => void;
}
const MissingCustomKeyModal: React.FC<MissingCustomKeyModalProps> = ({ onClose, onOpenSettings }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">Custom API Key Required</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <main className="p-6 space-y-4 text-gray-300">
                    <p>You've selected "Bring Your Own Key" for API usage, but haven't provided a Google AI Studio API key.</p>
                    <p>Please add your key in the settings to proceed with video generation.</p>
                </main>
                <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                    <button type="button" onClick={onOpenSettings} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Open Settings</button>
                </footer>
            </div>
        </div>
    );
};


// --- PROJECT FORM MODAL COMPONENT ---
interface ProjectFormModalProps {
    project: Project | null;
    onClose: () => void;
    onSubmit: (projectData: Omit<Project, 'id'>) => void;
    categories: string[];
    clients: Client[];
    selectedClientId?: string;
}
const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, onClose, onSubmit, categories, clients, selectedClientId }) => {
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [topic, setTopic] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [tone, setTone] = useState('');
    const [category, setCategory] = useState('');
    const [keywordsToInclude, setKeywordsToInclude] = useState('');
    const [keywordsToExclude, setKeywordsToExclude] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [sfxPrompt, setSfxPrompt] = useState('');
    const [research, setResearch] = useState<ResearchReport | null>(null);
    const [isResearching, setIsResearching] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setClientId(project.clientId);
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
        } else {
            setClientId(selectedClientId || '');
        }
    }, [project, selectedClientId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            alert('Please select a client for this project.');
            return;
        }
        onSubmit({ name, clientId, topic, sourceUrl, targetAudience, tone, category, keywordsToInclude, keywordsToExclude, negativePrompt, sfxPrompt, research: research || undefined });
    };
    
    const handleResearch = async () => {
        if (!topic && !sourceUrl) {
            alert('Please provide a Topic or a Source URL to start research.');
            return;
        }
        setIsResearching(true);
        setResearch(null);
        try {
            const report = await performResearch(topic, sourceUrl);
            setResearch(report);
            setKeywordsToInclude(report.keywordsToInclude.join(', '));
            setKeywordsToExclude(report.keywordsToExclude.join(', '));
            setNegativePrompt(report.negativePrompt);
            setSfxPrompt(report.sfxPrompt || '');
        } catch(error) {
            alert(error instanceof Error ? error.message : "An unknown error occurred during research.");
            console.error(error);
        } finally {
            setIsResearching(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-bold text-white">{project ? 'Edit Project' : 'Create New Project'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Client</label>
                            <select value={clientId} onChange={e => setClientId(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                                <option value="" disabled>-- Select a Client --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label><input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Topic / Product / Person</label><input value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Source URL (Optional)</label><input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        
                        <div className="bg-gray-900/50 p-4 rounded-lg space-y-3 ring-1 ring-gray-700">
                            <div className="flex justify-between items-center">
                                <h4 className="text-base font-bold text-gray-200">AI-Powered Strategy</h4>
                                <button type="button" onClick={handleResearch} disabled={isResearching} className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 disabled:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors">
                                    {isResearching ? <Spinner /> : <SparklesIcon className="h-4 w-4" />}
                                    {isResearching ? 'Researching...' : 'Research & Suggest'}
                                </button>
                            </div>
                            {research && (
                                <div className="border-t border-gray-600 pt-3 space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-400">Sentiment:</span> <span className="font-bold text-teal-300">{research.sentiment}</span></p>
                                    <p className="text-gray-300"><span className="font-semibold text-gray-400">Summary:</span> {research.summary}</p>
                                </div>
                            )}
                        </div>

                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label><input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tone of Voice</label>
                            <input list="tone-options" value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                            <datalist id="tone-options">
                                {TONE_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Category (Optional)</label>
                            <input list="category-options" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                            <datalist id="category-options">
                                {categories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Keywords to Include (AI Suggested)</label><input value={keywordsToInclude} onChange={e => setKeywordsToInclude(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Keywords to Exclude (AI Suggested)</label><input value={keywordsToExclude} onChange={e => setKeywordsToExclude(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Negative Prompt (AI Suggested)</label><textarea rows={2} value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                    </main>
                    <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{project ? 'Save Changes' : 'Create Project'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

// --- PROJECT MANAGER MODAL COMPONENT ---
interface ProjectManagerModalProps {
    projects: Project[];
    clients: Client[];
    onClose: () => void;
    onCreate: (projectData: Omit<Project, 'id'>) => void;
    onUpdate: (project: Project) => void;
    onDelete: (id: string) => void;
    categories: string[];
}
const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ projects, clients, onClose, onCreate, onUpdate, onDelete, categories }) => {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [clientFilter, setClientFilter] = useState<string>('');
    
    const clientMap = React.useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const filteredProjects = React.useMemo(() => {
        return clientFilter ? projects.filter(p => p.clientId === clientFilter) : projects;
    }, [projects, clientFilter]);

    const handleFormSubmit = (projectData: Omit<Project, 'id'>) => {
        if (editingProject) {
            onUpdate({ ...projectData, id: editingProject.id });
        } else {
            onCreate(projectData);
        }
        setEditingProject(null);
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            onDelete(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Manage Projects</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <div className="p-4 flex justify-between items-center border-b border-gray-700 flex-shrink-0 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setView('grid')} className={`px-3 py-1 rounded-md text-sm ${view === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><GridIcon className="h-5 w-5"/></button>
                            <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-sm ${view === 'list' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><ListIcon className="h-5 w-5"/></button>
                        </div>
                        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">All Clients</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <WandIcon className="h-5 w-5"/> Create New Project
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                        <p className="text-center text-gray-400">{projects.length === 0 ? "You have no saved projects." : "No projects found for this client."}</p>
                    ) : view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map(p => (
                                <div key={p.id} className="bg-gray-700 rounded-lg p-4 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg text-teal-400 truncate">{p.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{clientMap.get(p.clientId) || 'Unknown Client'}</p>
                                        <p className="text-sm text-gray-300 mt-1 truncate" title={p.topic}>Topic: {p.topic}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => setEditingProject(p)} className="flex-1 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1.5 px-3 rounded-md transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md transition-colors"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {filteredProjects.map(p => (
                                <li key={p.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-white truncate">{p.name}</span>
                                        <span className="text-gray-400 font-normal text-sm ml-2 hidden sm:inline">({p.topic})</span>
                                        <p className="text-xs text-gray-400">{clientMap.get(p.clientId) || 'Unknown Client'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingProject(p)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"><EditIcon className="h-5 w-5 text-white"/></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {(isCreating || editingProject) && (
                <ProjectFormModal
                    project={editingProject}
                    onClose={() => { setIsCreating(false); setEditingProject(null); }}
                    onSubmit={handleFormSubmit}
                    categories={categories}
                    clients={clients}
                    selectedClientId={clientFilter}
                />
            )}
        </div>
    );
};


// --- USER DROPDOWN COMPONENT ---
interface UserDropdownProps {
    user: User;
    onSettings: () => void;
    onWallet: () => void;
    onLogout: () => void;
}
const UserDropdown: React.FC<UserDropdownProps> = ({ user, onSettings, onWallet, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 rounded-full hover:bg-gray-700 p-1 pr-3 transition-colors">
                <img src={user.avatarUrl} alt="User Avatar" className="h-8 w-8 rounded-full" />
                <span className="text-white font-medium text-sm">{user.name}</span>
                 <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                    <button onClick={() => { onSettings(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"><SettingsIcon className="h-5 w-5"/> Settings</button>
                    <button onClick={() => { onWallet(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"><WalletIcon className="h-5 w-5"/> Wallet</button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"><LogoutIcon className="h-5 w-5"/> Logout</button>
                </div>
            )}
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [isApiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [isMissingCustomKeyModalVisible, setMissingCustomKeyModalVisible] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'IDLE', message: '' });
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>('');
  
  const [currentUser, setCurrentUser] = useState<User>({
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Doe`,
    walletBalance: 50.00,
  });
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    apiKeyOption: 'platform',
    customGoogleApiKey: '',
    customElevenLabsApiKey: '',
  });

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('viralContentProjects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      
      const savedClients = localStorage.getItem('viralContentClients');
      if (savedClients) setClients(JSON.parse(savedClients));
      
      const savedSettings = localStorage.getItem('viralContentSettings');
      if (savedSettings) setUserSettings(JSON.parse(savedSettings));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('viralContentProjects', JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, [projects]);
  
  useEffect(() => {
    try {
      localStorage.setItem('viralContentClients', JSON.stringify(clients));
    } catch (error) {
      console.error("Failed to save clients to localStorage", error);
    }
  }, [clients]);
  
  const handleSaveSettings = (settings: UserSettings) => {
    setUserSettings(settings);
     try {
      localStorage.setItem('viralContentSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
    setIsSettingsModalOpen(false);
  }

  // Client CRUD
  const handleCreateClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = { ...clientData, id: crypto.randomUUID() };
    setClients(prev => [...prev, newClient].sort((a,b) => a.name.localeCompare(b.name)));
  };
  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c).sort((a,b) => a.name.localeCompare(b.name)));
  };
  const handleDeleteClient = (id: string) => {
    if (projects.some(p => p.clientId === id)) {
        alert("Cannot delete client with active projects. Please re-assign or delete projects first.");
        return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Project CRUD
  const handleCreateProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = { ...projectData, id: crypto.randomUUID() };
    setProjects(prev => [...prev, newProject].sort((a,b) => a.name.localeCompare(b.name)));
  };
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p).sort((a,b) => a.name.localeCompare(b.name)));
  };
  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };
  
  const handlePostUpdate = useCallback((postId: string, update: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(p => p.id === postId ? { ...p, ...update } : p)
    );
  }, []);
  
  const handleVideoError = useCallback((error: Error) => {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setGenerationState({ status: 'ERROR', message: `Video generation failed: ${errorMessage}` });
      setTimeout(() => setGenerationState({ status: 'IDLE', message: '' }), 5000);
  }, []);


  const handleGenerate = useCallback(async (options: GenerationOptions) => {
    if (options.includeVideo) {
        const isCustomKeyMode = userSettings.apiKeyOption === 'custom';
        const hasCustomKey = !!userSettings.customGoogleApiKey;

        if (isCustomKeyMode && !hasCustomKey) {
            setMissingCustomKeyModalVisible(true);
            return;
        }

        if (!isCustomKeyMode) {
            setGenerationState({ status: 'LOADING', message: 'Checking API key for video...' });
            // @ts-ignore - aistudio is available on the window
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setGenerationState({ status: 'IDLE', message: '' });
                setApiKeyModalVisible(true);
                return;
            }
        }
    }

    setGenerationState({ status: 'LOADING', message: 'Warming up the AI...' });
    
    const customApiKeys = userSettings.apiKeyOption === 'custom' ? {
        google: userSettings.customGoogleApiKey,
        elevenlabs: userSettings.customElevenLabsApiKey,
    } : undefined;

    try {
      const newPosts = await generateContentForAllPlatforms(
        options, 
        (message) => setGenerationState({ status: 'LOADING', message }),
        handlePostUpdate,
        handleVideoError,
        customApiKeys
      );
      setPosts(prevPosts => [...newPosts, ...prevPosts]);
      setGenerationState({ status: 'SUCCESS', message: 'Content generated successfully!' });
      setTimeout(() => setGenerationState({ status: 'IDLE', message: '' }), 3000);
    } catch (error) {
      console.error("Content generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setGenerationState({ status: 'ERROR', message: `Generation failed: ${errorMessage}` });
      setTimeout(() => setGenerationState({ status: 'IDLE', message: '' }), 5000);
    }
  }, [handlePostUpdate, userSettings, handleVideoError]);

  const handleDelete = (id: string) => {
    setPosts(posts.filter(post => post.id !== id));
  };
  
  const handleBulkDelete = (ids: string[]) => {
    setPosts(posts.filter(post => !ids.includes(post.id)));
  };

  const handleUpdateStatus = (postId: string, status: PostStatus) => {
    handlePostUpdate(postId, { status });
  };
  
  const handleBulkUpdateStatus = (ids: string[], status: PostStatus) => {
     setPosts(prevPosts =>
      prevPosts.map(post =>
        ids.includes(post.id) ? { ...post, status } : post
      )
    );
  };

  const handleDownload = (post: Post) => {
    if (post.videoUrl && post.videoUrl !== 'GENERATING' && post.videoUrl !== 'FAILED') {
       window.open(post.videoUrl, '_blank');
    } else if (post.imageUrl) {
        downloadFile(post.imageUrl, `${post.platform}_${post.id}.jpeg`, 'image/jpeg');
    } else if (post.audioUrl) {
        downloadFile(post.audioUrl, `${post.platform}_${post.id}_audio.mp3`, 'audio/mpeg');
    } else {
        downloadFile(post.content, `${post.platform}_${post.id}.txt`, 'text/plain');
    }
  };

  const handleSendToN8n = async (post: Post) => {
    if (!n8nWebhookUrl) {
      alert('Please enter your n8n Webhook URL in the control panel.');
      return false;
    }
    if (!URL.canParse(n8nWebhookUrl)) {
        alert('The provided n8n Webhook URL is invalid.');
        return false;
    }

    try {
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Failed to send to n8n:', error);
        alert(`Failed to send post to n8n. Check console for details.`);
        return false;
    }
  };
  
  const handleBulkSendToN8n = async (ids: string[]) => {
    const postsToSend = posts.filter(p => ids.includes(p.id));
    for (const post of postsToSend) {
        const success = await handleSendToN8n(post);
        if(!success) {
            alert(`Aborting bulk send due to an error with post for ${post.platform}.`);
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    }
    alert(`${postsToSend.length} posts sent to n8n successfully!`);
  };
  
  const handleRepurpose = async (sourcePost: Post, targetPlatforms: Platform[]) => {
    if (!sourcePost.generationOptions) {
        alert("Cannot repurpose this post: original generation options are missing.");
        return;
    }
    const newOptions: GenerationOptions = {
        ...sourcePost.generationOptions,
        platforms: targetPlatforms,
    };
    await handleGenerate(newOptions);
  };
  
  const uniqueCategories = React.useMemo(() => {
    const categories = new Set(posts.map(p => p.category).filter(Boolean) as string[]);
    projects.forEach(p => p.category && categories.add(p.category));
    return Array.from(categories);
  }, [posts, projects]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
           <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <LogoIcon className="h-8 w-8 text-teal-400" />
                <h1 className="text-2xl font-bold tracking-tight text-white">Viral Content AI Studio</h1>
            </div>
            <button onClick={() => setIsClientManagerOpen(true)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm py-2 px-3 rounded-md transition-colors">
                <BriefcaseIcon className="h-5 w-5"/> Manage Clients
            </button>
          </div>
          <UserDropdown 
            user={currentUser}
            onSettings={() => setIsSettingsModalOpen(true)}
            onWallet={() => setIsWalletModalOpen(true)}
            onLogout={() => alert('Logout functionality is not implemented.')}
          />
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
             <ControlPanel 
                posts={posts}
                onGenerate={handleGenerate} 
                generationState={generationState}
                n8nWebhookUrl={n8nWebhookUrl}
                setN8nWebhookUrl={setN8nWebhookUrl}
                projects={projects}
                clients={clients}
                onCreateProject={handleCreateProject}
                onManageProjects={() => setIsProjectManagerOpen(true)}
            />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <ContentLibrary 
              posts={posts}
              clients={clients} 
              onDelete={handleDelete} 
              onDownload={handleDownload}
              onSendToN8n={handleSendToN8n}
              onUpdatePost={handlePostUpdate}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkSendToN8n={handleBulkSendToN8n}
              onRepurpose={handleRepurpose}
            />
          </div>
        </div>
      </main>
      {isProjectManagerOpen && (
        <ProjectManagerModal
          projects={projects}
          clients={clients}
          onClose={() => setIsProjectManagerOpen(false)}
          onCreate={handleCreateProject}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          categories={uniqueCategories}
        />
      )}
      {isClientManagerOpen && (
        <ClientManagerModal
            clients={clients}
            onClose={() => setIsClientManagerOpen(false)}
            onCreate={handleCreateClient}
            onUpdate={handleUpdateClient}
            onDelete={handleDeleteClient}
        />
      )}
      {isSettingsModalOpen && (
        <SettingsModal
            settings={userSettings}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleSaveSettings}
        />
      )}
      {isWalletModalOpen && (
        <WalletModal
            user={currentUser}
            onClose={() => setIsWalletModalOpen(false)}
            onAddFunds={(amount) => {
                alert(`Adding $${amount} to wallet (simulation).`);
                setCurrentUser(u => ({...u, walletBalance: u.walletBalance + amount}));
                setIsWalletModalOpen(false);
            }}
        />
      )}
       {isApiKeyModalVisible && (
            <ApiKeyModal
                onClose={() => setApiKeyModalVisible(false)}
                onSelectKey={() => {
                    // @ts-ignore - aistudio is available on the window
                    window.aistudio.openSelectKey();
                    setApiKeyModalVisible(false);
                     setTimeout(() => alert("API Key selected. Please click 'Generate Content' again to start video generation."), 100);
                }}
            />
        )}
        {isMissingCustomKeyModalVisible && (
            <MissingCustomKeyModal
                onClose={() => setMissingCustomKeyModalVisible(false)}
                onOpenSettings={() => {
                    setMissingCustomKeyModalVisible(false);
                    setIsSettingsModalOpen(true);
                }}
            />
        )}
    </div>
  );
};

export default App;