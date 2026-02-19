'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student, StudentDocument } from '@/lib/types';
import Modal from '@/components/Modal';
import FileUpload from '@/components/FileUpload';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [documents, setDocuments] = useState<Record<string, StudentDocument[]>>({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        major: '',
        desired_role: '',
        desired_company: '',
        portfolio_link: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
    const [portfolioPdfFile, setPortfolioPdfFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchStudents = useCallback(async () => {
        const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        setStudents(data || []);

        // Fetch all documents
        const { data: docs } = await supabase.from('student_documents').select('*');
        const grouped: Record<string, StudentDocument[]> = {};
        docs?.forEach(doc => {
            if (!grouped[doc.student_id]) grouped[doc.student_id] = [];
            grouped[doc.student_id].push(doc);
        });
        setDocuments(grouped);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const uploadFile = async (file: File, studentId: string, docType: string) => {
        const fileExt = file.name.split('.').pop();
        const path = `${studentId}/${docType}_${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage.from('documents').upload(path, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

        await supabase.from('student_documents').insert({
            student_id: studentId,
            doc_type: docType,
            file_url: publicUrl,
            file_name: file.name,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let studentId: string;

            if (editingStudent) {
                await supabase.from('students').update({
                    name: form.name,
                    major: form.major,
                    desired_role: form.desired_role,
                    desired_company: form.desired_company,
                    portfolio_link: form.portfolio_link || null,
                }).eq('id', editingStudent.id);
                studentId = editingStudent.id;
            } else {
                const { data, error } = await supabase.from('students').insert({
                    name: form.name,
                    major: form.major,
                    desired_role: form.desired_role,
                    desired_company: form.desired_company,
                    portfolio_link: form.portfolio_link || null,
                }).select().single();
                if (error) throw error;
                studentId = data.id;
            }

            // Upload files
            if (resumeFile) await uploadFile(resumeFile, studentId, 'resume');
            if (coverLetterFile) await uploadFile(coverLetterFile, studentId, 'cover_letter');
            if (portfolioPdfFile) await uploadFile(portfolioPdfFile, studentId, 'portfolio_pdf');

            resetForm();
            setModalOpen(false);
            await fetchStudents();
        } catch {
            alert('저장에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await supabase.from('student_documents').delete().eq('student_id', id);
        await supabase.from('ai_analysis').delete().eq('student_id', id);
        await supabase.from('students').delete().eq('id', id);
        setDeleteConfirm(null);
        await fetchStudents();
    };

    const openEdit = (student: Student) => {
        setEditingStudent(student);
        setForm({
            name: student.name,
            major: student.major || '',
            desired_role: student.desired_role || '',
            desired_company: student.desired_company || '',
            portfolio_link: student.portfolio_link || '',
        });
        setResumeFile(null);
        setCoverLetterFile(null);
        setPortfolioPdfFile(null);
        setModalOpen(true);
    };

    const resetForm = () => {
        setForm({ name: '', major: '', desired_role: '', desired_company: '', portfolio_link: '' });
        setResumeFile(null);
        setCoverLetterFile(null);
        setPortfolioPdfFile(null);
        setEditingStudent(null);
    };

    const getDocByType = (studentId: string, type: string) => {
        return documents[studentId]?.find(d => d.doc_type === type);
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
                    <h1 className="text-xl font-semibold" style={{ color: '#111827' }}>학생 관리</h1>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>등록된 학생: {students.length}명</p>
                </div>
                <button
                    onClick={() => { resetForm(); setModalOpen(true); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#111827'; }}
                >
                    + 학생 등록
                </button>
            </div>

            {/* Table */}
            {students.length === 0 ? (
                <div className="text-center py-20 rounded-lg" style={{ border: '1px solid #e5e7eb' }}>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>등록된 학생이 없습니다.</p>
                    <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>위의 &apos;학생 등록&apos; 버튼을 눌러 시작하세요.</p>
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>이름</th>
                                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>전공</th>
                                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>희망 직무</th>
                                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>희망 회사</th>
                                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>서류</th>
                                <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => (
                                <tr
                                    key={student.id}
                                    style={{
                                        borderBottom: idx < students.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#111827' }}>{student.name}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.major || '-'}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.desired_role || '-'}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.desired_company || '-'}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1.5">
                                            {getDocByType(student.id, 'resume') && (
                                                <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>이력서</span>
                                            )}
                                            {getDocByType(student.id, 'cover_letter') && (
                                                <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>자소서</span>
                                            )}
                                            {(student.portfolio_link || getDocByType(student.id, 'portfolio_pdf')) && (
                                                <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>포트폴리오</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(student)}
                                                className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                                style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#374151' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                수정
                                            </button>
                                            {deleteConfirm === student.id ? (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
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
                                                    onClick={() => setDeleteConfirm(student.id)}
                                                    className="px-3 py-1 text-xs rounded-md cursor-pointer"
                                                    style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#6b7280' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#991b1b'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Student Form Modal */}
            <Modal
                open={modalOpen}
                onClose={() => { setModalOpen(false); resetForm(); }}
                title={editingStudent ? '학생 정보 수정' : '새 학생 등록'}
                maxWidth="640px"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>이름 *</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                required
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>전공</label>
                            <input
                                value={form.major}
                                onChange={(e) => setForm(p => ({ ...p, major: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>희망 직무</label>
                            <input
                                value={form.desired_role}
                                onChange={(e) => setForm(p => ({ ...p, desired_role: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>희망 회사</label>
                            <input
                                value={form.desired_company}
                                onChange={(e) => setForm(p => ({ ...p, desired_company: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                        </div>
                    </div>

                    {/* Portfolio Link */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>포트폴리오 외부 링크 (URL)</label>
                        <input
                            value={form.portfolio_link}
                            onChange={(e) => setForm(p => ({ ...p, portfolio_link: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #f3f4f6' }} />

                    {/* File Uploads */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>포트폴리오 PDF</label>
                        <FileUpload
                            onFileSelect={setPortfolioPdfFile}
                            label="포트폴리오 PDF 업로드"
                            currentFileName={portfolioPdfFile?.name}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>이력서 PDF</label>
                            <FileUpload
                                onFileSelect={setResumeFile}
                                label="이력서 업로드"
                                currentFileName={resumeFile?.name}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>자기소개서 PDF</label>
                            <FileUpload
                                onFileSelect={setCoverLetterFile}
                                label="자소서 업로드"
                                currentFileName={coverLetterFile?.name}
                            />
                        </div>
                    </div>

                    {/* Submit */}
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
                            {saving ? '저장 중...' : editingStudent ? '수정 완료' : '학생 등록'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
