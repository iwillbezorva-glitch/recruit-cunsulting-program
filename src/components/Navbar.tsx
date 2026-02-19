'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname.startsWith(path);

    return (
        <header className="border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 no-underline">
                    <span className="text-lg font-semibold tracking-tight" style={{ color: '#111827' }}>
                        AI 면접 지원
                    </span>
                </Link>

                {/* Navigation */}
                {user && (
                    <nav className="flex items-center gap-1">
                        {user.role === 'admin' ? (
                            <>
                                <NavLink href="/dashboard/admin/students" active={isActive('/dashboard/admin/students')}>
                                    학생 관리
                                </NavLink>
                                <NavLink href="/dashboard/admin/gems" active={isActive('/dashboard/admin/gems')}>
                                    AI Gem 관리
                                </NavLink>
                            </>
                        ) : (
                            <NavLink href="/dashboard/interviewer" active={isActive('/dashboard/interviewer')}>
                                학생 목록
                            </NavLink>
                        )}
                    </nav>
                )}

                {/* User info & Sign out */}
                {user && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm" style={{ color: '#6b7280' }}>
                            <span className="font-medium" style={{ color: '#111827' }}>{user.name}</span>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full border" style={{
                                borderColor: '#e5e7eb',
                                color: '#6b7280',
                                backgroundColor: '#f3f4f6'
                            }}>
                                {user.role === 'admin' ? '관리자' : '면접관'}
                            </span>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-sm px-3 py-1.5 rounded-md border cursor-pointer"
                            style={{
                                borderColor: '#e5e7eb',
                                color: '#6b7280',
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            로그아웃
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="px-3 py-2 text-sm font-medium rounded-md no-underline"
            style={{
                color: active ? '#111827' : '#6b7280',
                backgroundColor: active ? '#f3f4f6' : 'transparent',
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            {children}
        </Link>
    );
}
