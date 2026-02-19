'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import Link from 'next/link';

export default function InterviewerDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchStudents = useCallback(async () => {
        const { data } = await supabase.from('students').select('*').order('name');
        setStudents(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filtered = students.filter(s =>
        s.name.includes(search) ||
        s.major?.includes(search) ||
        s.desired_role?.includes(search) ||
        s.desired_company?.includes(search)
    );

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
                    <h1 className="text-xl font-semibold" style={{ color: '#111827' }}>학생 목록</h1>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{filtered.length}명의 학생</p>
                </div>
                <div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="이름, 전공, 직무 검색..."
                        className="px-4 py-2 rounded-lg text-sm w-64"
                        style={{ border: '1px solid #e5e7eb', outline: 'none' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    />
                </div>
            </div>

            {/* Student Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 rounded-lg" style={{ border: '1px solid #e5e7eb' }}>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>
                        {search ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                    </p>
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
                                <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((student, idx) => (
                                <tr
                                    key={student.id}
                                    style={{
                                        borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#111827' }}>{student.name}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.major || '-'}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.desired_role || '-'}</td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6b7280' }}>{student.desired_company || '-'}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <Link
                                            href={`/dashboard/interviewer/students/${student.id}`}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md no-underline"
                                            style={{ backgroundColor: '#111827', color: '#ffffff' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#111827'; }}
                                        >
                                            상세 보기
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
