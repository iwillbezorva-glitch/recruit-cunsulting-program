'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GemLink } from '@/lib/types';
import Modal from '@/components/Modal';

export default function AdminGemsPage() {
    const [gems, setGems] = useState<GemLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<GemLink | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', description: '', url: '' });
    const [saving, setSaving] = useState(false);

    const fetchGems = useCallback(async () => {
        const { data } = await supabase.from('gem_links').select('*').order('created_at', { ascending: false });
        setGems(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchGems();
    }, [fetchGems]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editing) {
                await supabase.from('gem_links').update({
                    title: form.title,
                    description: form.description || null,
                    url: form.url,
                }).eq('id', editing.id);
            } else {
                await supabase.from('gem_links').insert({
                    title: form.title,
                    description: form.description || null,
                    url: form.url,
                });
            }
            setModalOpen(false);
            resetForm();
            await fetchGems();
        } catch {
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await supabase.from('gem_links').delete().eq('id', id);
        setDeleteConfirm(null);
        await fetchGems();
    };

    const openEdit = (gem: GemLink) => {
        setEditing(gem);
        setForm({ title: gem.title, description: gem.description || '', url: gem.url });
        setModalOpen(true);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', url: '' });
        setEditing(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm" style={{ color: '#9ca3af' }}>로딩 중...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl font-semibold" style={{ color: '#111827' }}>AI Gem 관리</h1>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>등록된 Gem: {gems.length}개</p>
                </div>
                <button
                    onClick={() => { resetForm(); setModalOpen(true); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#111827'; }}
                >
                    + Gem 추가
                </button>
            </div>

            {/* Gem Cards */}
            {gems.length === 0 ? (
                <div className="text-center py-20 rounded-lg" style={{ border: '1px solid #e5e7eb' }}>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>등록된 Gem이 없습니다.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {gems.map((gem) => (
                        <div
                            key={gem.id}
                            className="p-5 rounded-lg"
                            style={{ border: '1px solid #e5e7eb' }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>{gem.title}</h3>
                                    {gem.description && (
                                        <p className="text-sm mb-2" style={{ color: '#6b7280' }}>{gem.description}</p>
                                    )}
                                    <a
                                        href={gem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs inline-flex items-center gap-1"
                                        style={{ color: '#6b7280' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                                    >
                                        {gem.url.length > 60 ? gem.url.substring(0, 60) + '...' : gem.url}
                                        <span>↗</span>
                                    </a>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => openEdit(gem)}
                                        className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                        style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#374151' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        수정
                                    </button>
                                    {deleteConfirm === gem.id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDelete(gem.id)}
                                                className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                                style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none' }}
                                            >
                                                확인
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                                style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#6b7280' }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(gem.id)}
                                            className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                            style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#6b7280' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#991b1b'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Gem Form Modal */}
            <Modal
                open={modalOpen}
                onClose={() => { setModalOpen(false); resetForm(); }}
                title={editing ? 'Gem 수정' : '새 Gem 추가'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>Gem 이름 *</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                            required
                            placeholder="예: IT 개발자 맞춤형 면접 Gem"
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>설명</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="해당 Gem의 용도를 설명해 주세요"
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>Gem URL *</label>
                        <input
                            value={form.url}
                            onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))}
                            required
                            placeholder="https://gemini.google.com/..."
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => { setModalOpen(false); resetForm(); }}
                            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                            style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#6b7280' }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer"
                            style={{ backgroundColor: saving ? '#6b7280' : '#111827', color: '#ffffff', border: 'none' }}
                        >
                            {saving ? '저장 중...' : editing ? '수정 완료' : 'Gem 추가'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
