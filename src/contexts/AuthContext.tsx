'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
        user: User | null;
        session: Session | null;
        loading: boolean;
        signIn: (email: string, password: string) => Promise<{ error: string | null }>;
        signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
        const [user, setUser] = useState<User | null>(null);
        const [session, setSession] = useState<Session | null>(null);
        const [loading, setLoading] = useState(true);

    useEffect(() => {
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                                setSession(session);
                                if (session?.user) {
                                                    const { data } = await supabase
                                                        .from('users')
                                                        .select('*')
                                                        .eq('id', session.user.id)
                                                        .single();
                                                    setUser(data);
                                } else {
                                                    setUser(null);
                                }
                                setLoading(false);
                });

                      return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error: error.message };
                return { error: null };
    };

    const signOut = async () => {
                await supabase.auth.signOut();
                setUser(null);
                setSession(null);
    };

    return (
                <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
                    {children}
                </AuthContext.Provider>AuthContext.Provider>
            );
}

export function useAuth() {
        const context = useContext(AuthContext);
        if (context === undefined) {
                    throw new Error('useAuth must be used within an AuthProvider');
        }
        return context;
}
