import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { CloseIcon, EditIcon, TrashIcon, BriefcaseIcon } from './Icons';

// --- CLIENT FORM MODAL COMPONENT ---
interface ClientFormModalProps {
    client: Client | null;
    onClose: () => void;
    onSubmit: (clientData: Omit<Client, 'id'>) => void;
}
const ClientFormModal: React.FC<ClientFormModalProps> = ({ client, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (client) {
            setName(client.name);
            setContactName(client.contactName || '');
            setContactEmail(client.contactEmail || '');
            setNotes(client.notes || '');
        }
    }, [client]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, contactName, contactEmail, notes });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-bold text-white">{client ? 'Edit Client' : 'Create New Client'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label><input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Contact Name (Optional)</label><input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Contact Email (Optional)</label><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/></div>
                    </main>
                    <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{client ? 'Save Changes' : 'Create Client'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

// --- CLIENT MANAGER MODAL COMPONENT ---
interface ClientManagerModalProps {
    clients: Client[];
    onClose: () => void;
    onCreate: (clientData: Omit<Client, 'id'>) => void;
    onUpdate: (client: Client) => void;
    onDelete: (id: string) => void;
}
export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ clients, onClose, onCreate, onUpdate, onDelete }) => {
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleFormSubmit = (clientData: Omit<Client, 'id'>) => {
        if (editingClient) {
            onUpdate({ ...clientData, id: editingClient.id });
        } else {
            onCreate(clientData);
        }
        setEditingClient(null);
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this client? This cannot be undone.')) {
            onDelete(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Manage Clients</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <div className="p-4 flex justify-end items-center border-b border-gray-700 flex-shrink-0">
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <BriefcaseIcon className="h-5 w-5"/> Add New Client
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {clients.length === 0 ? (
                        <p className="text-center text-gray-400">You haven't added any clients yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {clients.map(c => (
                                <li key={c.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                    <span className="font-semibold text-white truncate">{c.name} <span className="text-gray-400 font-normal text-sm ml-2 hidden sm:inline">({c.contactEmail || 'No email'})</span></span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingClient(c)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"><EditIcon className="h-5 w-5 text-white"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {(isCreating || editingClient) && (
                <ClientFormModal
                    client={editingClient}
                    onClose={() => { setIsCreating(false); setEditingClient(null); }}
                    onSubmit={handleFormSubmit}
                />
            )}
        </div>
    );
};
