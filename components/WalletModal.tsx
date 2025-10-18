import React, { useState } from 'react';
import type { User } from '../types';
import { CloseIcon, WalletIcon } from './Icons';

interface WalletModalProps {
    user: User;
    onClose: () => void;
    onAddFunds: (amount: number) => void;
}

const mockTransactions = [
    { id: 1, date: '2024-07-20', description: 'Content Generation (5 posts)', amount: -2.50 },
    { id: 2, date: '2024-07-19', description: 'Video Generation (TikTok)', amount: -5.00 },
    { id: 3, date: '2024-07-18', description: 'Funds Added', amount: 20.00 },
    { id: 4, date: '2024-07-15', description: 'Initial Deposit', amount: 50.00 },
];

export const WalletModal: React.FC<WalletModalProps> = ({ user, onClose, onAddFunds }) => {
    const [amount, setAmount] = useState('');
    
    const handleAddFunds = () => {
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0) {
            onAddFunds(numericAmount);
        } else {
            alert("Please enter a valid amount.");
        }
    };

    return (
         <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><WalletIcon className="h-6 w-6 text-teal-400"/> My Wallet</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="h-6 w-6 text-gray-400"/></button>
                </header>
                <main className="p-6 flex-grow overflow-y-auto">
                    <div className="bg-gray-900/50 p-6 rounded-lg text-center mb-6 ring-1 ring-gray-700">
                        <p className="text-sm text-gray-400">Current Balance</p>
                        <p className="text-4xl font-bold text-white mt-1">${user.walletBalance.toFixed(2)}</p>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-md font-bold text-gray-200 mb-2">Add Funds</h4>
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount" 
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            />
                            <button onClick={handleAddFunds} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Add</button>
                        </div>
                    </div>
                    
                    <div>
                         <h4 className="text-md font-bold text-gray-200 mb-2">Transaction History</h4>
                         <ul className="space-y-2">
                            {mockTransactions.map(tx => (
                                <li key={tx.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium text-gray-300">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{tx.date}</p>
                                    </div>
                                    <p className={`font-semibold ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                    </p>
                                </li>
                            ))}
                         </ul>
                    </div>
                </main>
                 <footer className="p-4 flex justify-end gap-3 bg-gray-700/50 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Close</button>
                </footer>
            </div>
        </div>
    );
};
