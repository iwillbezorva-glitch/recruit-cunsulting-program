-- =====================================================
-- 취업캠프 AI 면접 지원 플랫폼 - Supabase 스키마 DDL
-- Supabase SQL Editor에서 실행하세요.
-- =====================================================

-- 1. users 테이블 (사용자 관리)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'interviewer')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (true);

-- 2. students 테이블 (학생 기본 및 취업 정보)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  major TEXT,
  desired_role TEXT,
  desired_company TEXT,
  portfolio_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD students" ON public.students
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. student_documents 테이블 (파일 업로드 관리)
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter', 'portfolio_pdf')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD student_documents" ON public.student_documents
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. gem_links 테이블 (AI Gem 관리)
CREATE TABLE IF NOT EXISTS public.gem_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gem_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD gem_links" ON public.gem_links
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. ai_analysis 테이블 (AI 분석 결과)
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  gem_id UUID NOT NULL REFERENCES public.gem_links(id) ON DELETE CASCADE,
  result_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD ai_analysis" ON public.ai_analysis
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
