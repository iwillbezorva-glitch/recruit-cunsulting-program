'use client';

import React from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = '560px' }: ModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-white rounded-xl w-full mx-4 overflow-hidden"
                style={{
                    maxWidth,
                    border: '1px solid #e5e7eb',
                    maxHeight: '90vh',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                    <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer"
                        style={{ color: '#6b7280', backgroundColor: 'transparent', border: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        ✕
                    </button>
                </div>
                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 65px)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
