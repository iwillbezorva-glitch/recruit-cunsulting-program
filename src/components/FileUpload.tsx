'use client';

import React, { useRef, useState } from 'react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label?: string;
    currentFileName?: string | null;
}

export default function FileUpload({ onFileSelect, accept = '.pdf', label = 'PDF 파일 업로드', currentFileName }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState<string | null>(currentFileName || null);

    const handleFile = (file: File) => {
        setFileName(file.name);
        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className="relative rounded-lg p-6 text-center cursor-pointer"
            style={{
                border: `2px dashed ${dragOver ? '#111827' : '#e5e7eb'}`,
                backgroundColor: dragOver ? '#f9fafb' : '#ffffff',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8" style={{ color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {fileName ? (
                    <p className="text-sm font-medium" style={{ color: '#111827' }}>{fileName}</p>
                ) : (
                    <>
                        <p className="text-sm font-medium" style={{ color: '#111827' }}>{label}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>드래그하거나 클릭하여 파일 선택</p>
                    </>
                )}
            </div>
        </div>
    );
}
