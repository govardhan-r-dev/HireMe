-- HireMe.co relational schema reference. The local demo uses SQLite;
-- this schema is ready for migration to Supabase/PostgreSQL + pgvector.
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Compatibility storage envelope used by the existing domain layer. The app
-- mirrors each local record here while it gradually moves to the normalized
-- tables below. Keep this table private: the server uses the service role key.
create table if not exists app_records(
  table_name text not null,
  local_id bigint not null,
  payload jsonb not null,
  updated_at timestamptz default now(),
  primary key(table_name,local_id)
);
create index if not exists app_records_table_idx on app_records(table_name);
alter table app_records enable row level security;
grant select, insert, update, delete on public.app_records to service_role;

create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade, name text not null, role text not null check(role in ('employee','employer')), phone text, education text, college text, course text, target_role text, interests text, created_at timestamptz default now());
create table if not exists skills(id bigserial primary key,name text unique not null,category text,description text);
create table if not exists employee_skills(id bigserial primary key,user_id uuid references profiles(id) on delete cascade,skill_id bigint references skills(id),score int default 0,proficiency int default 0,verification_level text,breakdown jsonb default '{}'::jsonb,unique(user_id,skill_id));
create table if not exists skill_evidence(id bigserial primary key,user_id uuid references profiles(id) on delete cascade,skill_id bigint references skills(id),type text not null,points int default 0,sha256 text not null,text_content text,storage_path text,verified boolean default false,status text default 'pending_review',source text,source_document_hash text,created_at timestamptz default now(),unique(user_id,sha256));
create table if not exists candidate_records(id bigserial primary key,user_id uuid references profiles(id) on delete cascade,type text not null,title text,organization text,role text,start_date date,end_date date,description text,visibility text default 'PRIVATE',evidence_status text default 'SELF DECLARED',verification_status text default 'SELF DECLARED',source text,source_document_hash text,created_at timestamptz default now());
create table if not exists candidate_documents(id bigserial primary key,record_id bigint references candidate_records(id) on delete cascade,user_id uuid references profiles(id) on delete cascade,name text,mime text,storage_path text,sha256 text,text_content text,status text,visibility text,source text,created_at timestamptz default now());
create table if not exists companies(id bigserial primary key,owner_id uuid references profiles(id) on delete cascade,name text,industry text,location text,description text);
create table if not exists opportunities(id bigserial primary key,company_id bigint references companies(id) on delete cascade,title text not null,type text not null,description text,location text,compensation text,deadline date,status text default 'active');
create table if not exists opportunity_skills(id bigserial primary key,opportunity_id bigint references opportunities(id) on delete cascade,skill text,weight numeric,importance text,minimum_score int default 0);
create table if not exists applications(id bigserial primary key,user_id uuid references profiles(id) on delete cascade,opportunity_id bigint references opportunities(id) on delete cascade,status text,match_score numeric,created_at timestamptz default now(),unique(user_id,opportunity_id));
create table if not exists projects(id bigserial primary key,owner_id uuid references profiles(id),title text,description text,deadline date,github text,progress int default 0);
create table if not exists challenges(id bigserial primary key,company_id bigint references companies(id),title text,description text,deadline date,outcomes text);
create table if not exists challenge_submissions(id bigserial primary key,challenge_id bigint references challenges(id),user_id uuid references profiles(id),title text,description text,status text,created_at timestamptz default now());
create table if not exists industry_evaluations(id bigserial primary key,submission_id bigint references challenge_submissions(id),evaluator_id uuid references profiles(id),score int,feedback text,created_at timestamptz default now());
create table if not exists career_roles(id bigserial primary key,name text unique,description text);
create table if not exists role_requirements(id bigserial primary key,role_id bigint references career_roles(id),skill text,min_score int);
create table if not exists skill_relationships(id bigserial primary key,from_skill text,to_skill text,relationship text,embedding vector(384));
create table if not exists feed_posts(id bigserial primary key,user_id uuid references profiles(id),content text,kind text,likes int default 0,created_at timestamptz default now());
create table if not exists comments(id bigserial primary key,post_id bigint references feed_posts(id) on delete cascade,user_id uuid references profiles(id),content text,created_at timestamptz default now());
create table if not exists follows(id bigserial primary key,follower_id uuid references profiles(id),target_type text,target_id text,unique(follower_id,target_type,target_id));
create table if not exists messages(id bigserial primary key,from_user_id uuid references profiles(id),to_user_id uuid references profiles(id),content text,created_at timestamptz default now());
create table if not exists notifications(id bigserial primary key,user_id uuid references profiles(id) on delete cascade,title text,body text,read boolean default false,created_at timestamptz default now());
create table if not exists reputation(id bigserial primary key,user_id uuid unique references profiles(id) on delete cascade,score int default 0);
create table if not exists rag_documents(id bigserial primary key,kind text,source_id text,content text,embedding vector(384),created_at timestamptz default now());
create index if not exists rag_documents_embedding_idx on rag_documents using ivfflat (embedding vector_cosine_ops) with (lists=100);
