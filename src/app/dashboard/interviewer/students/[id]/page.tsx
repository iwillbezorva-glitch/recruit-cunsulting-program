'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student, StudentDocument, GemLink, AIAnalysis } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function StudentDetailPage() {
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [gems, setGems] = useState<GemLink[]>([]);
    const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
    const [loading, setLoading] = useState(true);

    // AI Analysis form
    const [selectedGemId, setSelectedGemId] = useState('');
    const [resultText, setResultText] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [copiedMessage, setCopiedMessage] = useState('');

    const fetchData = useCallback(async () => {
        const [studentRes, docsRes, gemsRes, analysisRes] = await Promise.all([
            supabase.from('students').select('*').eq('id', studentId).single(),
            supabase.from('student_documents').select('*').eq('student_id', studentId),
            supabase.from('gem_links').select('*').order('title'),
            supabase.from('ai_analysis').select('*, gem_links(*)').eq('student_id', studentId).order('created_at', { ascending: false }),
        ]);

        setStudent(studentRes.data);
        setDocuments(docsRes.data || []);
        setGems(gemsRes.data || []);
        setAnalyses(analysisRes.data || []);
        setLoading(false);
    }, [studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getDoc = (type: string) => documents.find(d => d.doc_type === type);

    const copyStudentData = async () => {
        if (!student) return;
        const resume = getDoc('resume');
        const coverLetter = getDoc('cover_letter');

        const text = [
            `[학생 정보]`,
            `이름: ${student.name}`,
            `전공: ${student.major || '미입력'}`,
            `희망 직무: ${student.desired_role || '미입력'}`,
            `희망 회사: ${student.desired_company || '미입력'}`,
            student.portfolio_link ? `포트폴리오 링크: ${student.portfolio_link}` : '',
            resume ? `이력서: ${resume.file_url}` : '',
            coverLetter ? `자기소개서: ${coverLetter.file_url}` : '',
        ].filter(Boolean).join('\n');

        await navigator.clipboard.writeText(text);
        setCopiedMessage('클립보드에 복사되었습니다!');
        setTimeout(() => setCopiedMessage(''), 2000);
    };

    const handleOpenGem = () => {
        const gem = gems.find(g => g.id === selectedGemId);
        if (gem) {
            window.open(gem.url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSaveAnalysis = async () => {
        if (!selectedGemId || !resultText.trim()) return;
        setSaving(true);

        try {
            // Check if analysis already exists for this student + gem
            const { data: existing } = await supabase
                .from('ai_analysis')
                .select('id')
                .eq('student_id', studentId)
                .eq('gem_id', selectedGemId)
                .maybeSingle();

            if (existing) {
                await supabase.from('ai_analysis').update({
                    result_text: resultText,
                    updated_at: new Date().toISOString(),
                }).eq('id', existing.id);
            } else {
                await supabase.from('ai_analysis').insert({
                    student_id: studentId,
                    gem_id: selectedGemId,
                    result_text: resultText,
                });
            }

            setSaveMessage('분석 결과가 저장되었습니다!');
            setTimeout(() => setSaveMessage(''), 3000);
            setResultText('');
            setSelectedGemId('');
            await fetchData();
        } catch {
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // Load existing analysis when gem is selected
    useEffect(() => {
        if (selectedGemId) {
            const existing = analyses.find(a => a.gem_id === selectedGemId);
            if (existing) {
                setResultText(existing.result_text);
            } else {
                setResultText('');
            }
        }
    }, [selectedGemId, analyses]);

    if (loading || !student) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm" style={{ color: '#9ca3af' }}>로딩 중...</p>
            </div>
        );
    }

    const resume = getDoc('resume');
    const coverLetter = getDoc('cover_letter');
    const portfolioPdf = getDoc('portfolio_pdf');

    return (
        <div>
            {/* Back Link */}
            <Link
                href="/dashboard/interviewer"
                className="inline-flex items-center gap-1 text-sm mb-6 no-underline"
                style={{ color: '#6b7280' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
                ← 학생 목록으로
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Side - Student Info (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Student Info Card */}
                    <div className="rounded-lg p-6" style={{ border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>{student.name}</h2>
                            <button
                                onClick={copyStudentData}
                                className="px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer flex items-center gap-1.5"
                                style={{
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: copiedMessage ? '#f3f4f6' : 'transparent',
                                    color: copiedMessage ? '#111827' : '#6b7280',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                                onMouseLeave={(e) => { if (!copiedMessage) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                {copiedMessage ? '✓ 복사됨' : '📋 데이터 요약 복사'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <InfoRow label="전공" value={student.major} />
                            <InfoRow label="희망 직무" value={student.desired_role} />
                            <InfoRow label="희망 회사" value={student.desired_company} />
                        </div>
                    </div>

                    {/* Documents Card */}
                    <div className="rounded-lg p-6" style={{ border: '1px solid #e5e7eb' }}>
                        <h3 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>서류 및 포트폴리오</h3>
                        <div className="space-y-3">
                            {/* Portfolio Link */}
                            {student.portfolio_link && (
                                <DocButton
                                    label="포트폴리오 링크"
                                    icon="🔗"
                                    onClick={() => window.open(student.portfolio_link!, '_blank')}
                                />
                            )}
                            {/* Portfolio PDF */}
                            {portfolioPdf && (
                                <DocButton
                                    label={`포트폴리오 PDF — ${portfolioPdf.file_name || 'download'}`}
                                    icon="📄"
                                    onClick={() => window.open(portfolioPdf.file_url, '_blank')}
                                />
                            )}
                            {/* Resume */}
                            {resume && (
                                <DocButton
                                    label={`이력서 — ${resume.file_name || 'download'}`}
                                    icon="📄"
                                    onClick={() => window.open(resume.file_url, '_blank')}
                                />
                            )}
                            {/* Cover Letter */}
                            {coverLetter && (
                                <DocButton
                                    label={`자기소개서 — ${coverLetter.file_name || 'download'}`}
                                    icon="📄"
                                    onClick={() => window.open(coverLetter.file_url, '_blank')}
                                />
                            )}
                            {!student.portfolio_link && !portfolioPdf && !resume && !coverLetter && (
                                <p className="text-sm" style={{ color: '#9ca3af' }}>등록된 서류가 없습니다.</p>
                            )}
                        </div>
                    </div>

                    {/* Past Analyses */}
                    {analyses.length > 0 && (
                        <div className="rounded-lg p-6" style={{ border: '1px solid #e5e7eb' }}>
                            <h3 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>
                                저장된 분석 결과 ({analyses.length})
                            </h3>
                            <div className="space-y-4">
                                {analyses.map((analysis) => (
                                    <div key={analysis.id} className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium" style={{ color: '#374151' }}>
                                                {analysis.gem_links?.title || 'Unknown Gem'}
                                            </span>
                                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                                                {new Date(analysis.updated_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#4b5563' }}>
                                            {analysis.result_text.length > 300
                                                ? analysis.result_text.substring(0, 300) + '...'
                                                : analysis.result_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - AI Analysis (3 cols) */}
                <div className="lg:col-span-3">
                    <div className="rounded-lg p-6" style={{ border: '1px solid #e5e7eb' }}>
                        <h2 className="text-lg font-semibold mb-6" style={{ color: '#111827' }}>AI 분석</h2>

                        {/* Step 1: Select Gem */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>
                                1. AI Gem 선택
                            </label>
                            <div className="flex gap-3">
                                <select
                                    value={selectedGemId}
                                    onChange={(e) => setSelectedGemId(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
                                    style={{ border: '1px solid #e5e7eb', outline: 'none', backgroundColor: '#ffffff' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                >
                                    <option value="">Gem을 선택하세요...</option>
                                    {gems.map(gem => (
                                        <option key={gem.id} value={gem.id}>{gem.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleOpenGem}
                                    disabled={!selectedGemId}
                                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
                                    style={{
                                        backgroundColor: selectedGemId ? '#111827' : '#e5e7eb',
                                        color: selectedGemId ? '#ffffff' : '#9ca3af',
                                        border: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedGemId) e.currentTarget.style.backgroundColor = '#374151';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedGemId) e.currentTarget.style.backgroundColor = '#111827';
                                    }}
                                >
                                    Gem 열기 ↗
                                </button>
                            </div>
                            {selectedGemId && (
                                <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                                    {gems.find(g => g.id === selectedGemId)?.description || ''}
                                </p>
                            )}
                        </div>

                        {/* Step 2: Paste Result */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>
                                2. AI 분석 결과 붙여넣기
                            </label>
                            <textarea
                                value={resultText}
                                onChange={(e) => setResultText(e.target.value)}
                                rows={16}
                                placeholder="Gem에서 얻은 분석 결과를 여기에 붙여넣으세요..."
                                className="w-full px-4 py-3 rounded-lg text-sm resize-none leading-relaxed"
                                style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                            <p className="text-xs mt-1 text-right" style={{ color: '#9ca3af' }}>
                                {resultText.length}자
                            </p>
                        </div>

                        {/* Step 3: Save */}
                        <div className="flex items-center justify-between">
                            {saveMessage && (
                                <p className="text-sm font-medium" style={{ color: '#059669' }}>
                                    ✓ {saveMessage}
                                </p>
                            )}
                            <div className="ml-auto">
                                <button
                                    onClick={handleSaveAnalysis}
                                    disabled={saving || !selectedGemId || !resultText.trim()}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                                    style={{
                                        backgroundColor: (saving || !selectedGemId || !resultText.trim()) ? '#e5e7eb' : '#111827',
                                        color: (saving || !selectedGemId || !resultText.trim()) ? '#9ca3af' : '#ffffff',
                                        border: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedGemId && resultText.trim() && !saving) {
                                            e.currentTarget.style.backgroundColor = '#374151';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedGemId && resultText.trim() && !saving) {
                                            e.currentTarget.style.backgroundColor = '#111827';
                                        }
                                    }}
                                >
                                    {saving ? '저장 중...' : '결과 저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex items-baseline gap-3">
            <span className="text-xs font-medium w-20 flex-shrink-0" style={{ color: '#9ca3af' }}>{label}</span>
            <span className="text-sm" style={{ color: '#111827' }}>{value || '-'}</span>
        </div>
    );
}

function DocButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-left cursor-pointer"
            style={{
                border: '1px solid #e5e7eb',
                backgroundColor: 'transparent',
                color: '#374151',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
            <span>{icon}</span>
            <span className="flex-1 truncate">{label}</span>
            <span style={{ color: '#9ca3af' }}>↗</span>
        </button>
    );
}
