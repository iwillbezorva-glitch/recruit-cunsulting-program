export interface User {
    id: string;
    email: string;
    role: 'admin' | 'interviewer';
    name: string;
}

export interface Student {
    id: string;
    name: string;
    major: string;
    desired_role: string;
    desired_company: string;
    portfolio_link: string | null;
    created_at: string;
}

export interface StudentDocument {
    id: string;
    student_id: string;
    doc_type: 'resume' | 'cover_letter' | 'portfolio_pdf';
    file_url: string;
    file_name: string | null;
    created_at: string;
}

export interface GemLink {
    id: string;
    title: string;
    description: string | null;
    url: string;
    created_at: string;
}

export interface AIAnalysis {
    id: string;
    student_id: string;
    gem_id: string;
    result_text: string;
    created_at: string;
    updated_at: string;
    gem_links?: GemLink;
}
