import React, { useState, useEffect } from 'react';
import type { UserSettings } from '../types';
import { CloseIcon, CheckCircleIcon } from './Icons';

interface SettingsModalProps {
    settings: UserSettings;
    onClose: () => void;
    onSave: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave }) => {
    const [currentSettings, setCurrentSettings] = useState<UserSettings>(settings);
    const [activeTab, setActiveTab] = useState<'apiKeys' | 'subscription'>('apiKeys');

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onSave(currentSettings);
    };

    const handleInputChange = (field: keyof UserSettings, value: string) => {
        setCurrentSettings(prev => ({...prev, [field]: value}));
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">Settings</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('apiKeys')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'apiKeys' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:bg-gray-700/50'}`}>API Keys</button>
                    <button onClick={() => setActiveTab('subscription')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'subscription' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:bg-gray-700/50'}`}>Subscription</button>
                </div>
                <main className="p-6 space-y-6 flex-grow overflow-y-auto">
                    {activeTab === 'apiKeys' && (
                        <div>
                            <h4 className="text-md font-bold text-gray-200 mb-2">API Key Configuration</h4>
                            <p className="text-sm text-gray-400 mb-4">You can use the platform's default keys (covered by your subscription) or provide your own.</p>
                            <div className="space-y-4">
                               <div onClick={() => handleInputChange('apiKeyOption', 'platform')} className={`p-4 rounded-lg border cursor-pointer ${currentSettings.apiKeyOption === 'platform' ? 'bg-teal-900/50 border-teal-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}>
                                    <div className="flex justify-between items-center">
                                        <label className="font-semibold text-white">Use Platform Key (Default)</label>
                                        {currentSettings.apiKeyOption === 'platform' && <CheckCircleIcon className="h-6 w-6 text-teal-400"/>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Convenient and easy. Usage is billed through your platform subscription. Subject to platform rate limits.</p>
                                </div>
                               <div onClick={() => handleInputChange('apiKeyOption', 'custom')} className={`p-4 rounded-lg border cursor-pointer ${currentSettings.apiKeyOption === 'custom' ? 'bg-teal-900/50 border-teal-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}>
                                     <div className="flex justify-between items-center">
                                        <label className="font-semibold text-white">Bring Your Own Key</label>
                                        {currentSettings.apiKeyOption === 'custom' && <CheckCircleIcon className="h-6 w-6 text-teal-400"/>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Ideal for heavy usage. You are billed directly by the API provider. Avoids platform rate limits.</p>
                                     {currentSettings.apiKeyOption === 'custom' && (
                                        <div className="mt-4 space-y-3" onClick={e => e.stopPropagation()}>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Google AI Studio API Key</label>
                                                <input type="password" value={currentSettings.customGoogleApiKey || ''} onChange={e => handleInputChange('customGoogleApiKey', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Enter your Google API Key"/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">ElevenLabs API Key</label>
                                                <input type="password" value={currentSettings.customElevenLabsApiKey || ''} onChange={e => handleInputChange('customElevenLabsApiKey', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Enter your ElevenLabs API Key"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'subscription' && (
                        <div>
                            <h4 className="text-md font-bold text-gray-200 mb-2">Subscription Details</h4>
                             <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-300">Your Current Plan: <span className="font-bold text-teal-400">Pro Plan</span></p>
                                <p className="text-sm text-gray-400 mt-1">This includes unlimited content generations using the platform API keys and access to all features.</p>
                                <button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Manage Subscription
                                </button>
                            </div>
                        </div>
                    )}
                </main>
                <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Save Settings</button>
                </footer>
            </div>
        </div>
    );
};
