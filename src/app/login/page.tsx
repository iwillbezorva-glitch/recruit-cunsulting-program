'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { error } = await signIn(email, password);
        if (error) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
            setIsLoading(false);
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#ffffff' }}>
            <div className="w-full" style={{ maxWidth: '400px' }}>
                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#111827' }}>
                        AI 면접 지원 플랫폼
                    </h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                        취업캠프 면접 관리 시스템에 로그인하세요
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="px-4 py-3 rounded-lg text-sm" style={{
                            backgroundColor: '#fef2f2',
                            color: '#991b1b',
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
                            이메일
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@example.com"
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                color: '#111827',
                                outline: 'none',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                color: '#111827',
                                outline: 'none',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                        style={{
                            backgroundColor: isLoading ? '#6b7280' : '#111827',
                            color: '#ffffff',
                            border: 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) e.currentTarget.style.backgroundColor = '#374151';
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) e.currentTarget.style.backgroundColor = '#111827';
                        }}
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <p className="text-center text-xs mt-8" style={{ color: '#9ca3af' }}>
                    © 2025 취업캠프 AI 면접 지원 플랫폼
                </p>
            </div>
        </div>
    );
}
