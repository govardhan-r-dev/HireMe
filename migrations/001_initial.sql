-- HireMe.co SQLite migration 001. Flexible records with indexed relational keys.
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE TABLE skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE employee_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
skill_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.skill_id')) VIRTUAL REFERENCES skills(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_employee_skills_user_id ON employee_skills(user_id);
CREATE INDEX idx_employee_skills_skill_id ON employee_skills(skill_id);
CREATE TABLE evidence (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
skill_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.skill_id')) VIRTUAL REFERENCES skills(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_evidence_user_id ON evidence(user_id);
CREATE INDEX idx_evidence_skill_id ON evidence(skill_id);
CREATE TABLE candidate_records (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_candidate_records_user_id ON candidate_records(user_id);
CREATE TABLE candidate_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
record_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.record_id')) VIRTUAL REFERENCES candidate_records(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_candidate_documents_user_id ON candidate_documents(user_id);
CREATE INDEX idx_candidate_documents_record_id ON candidate_documents(record_id);
CREATE TABLE candidate_claims (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
record_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.record_id')) VIRTUAL REFERENCES candidate_records(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_candidate_claims_record_id ON candidate_claims(record_id);
CREATE TABLE candidate_record_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
record_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.record_id')) VIRTUAL REFERENCES candidate_records(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_candidate_record_skills_record_id ON candidate_record_skills(record_id);
CREATE TABLE verification_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE record_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
record_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.record_id')) VIRTUAL REFERENCES candidate_records(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_record_audit_record_id ON record_audit(record_id);
CREATE TABLE assessments (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
assessment_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.assessment_id')) VIRTUAL REFERENCES assessments(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_assessment_id ON attempts(assessment_id);
CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
owner_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.owner_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE TABLE opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
company_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.company_id')) VIRTUAL REFERENCES companies(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE TABLE opportunity_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
opportunity_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.opportunity_id')) VIRTUAL REFERENCES opportunities(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_opportunity_skills_opportunity_id ON opportunity_skills(opportunity_id);
CREATE TABLE employer_preferences (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_employer_preferences_user_id ON employer_preferences(user_id);
CREATE TABLE employer_skill_weights (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
preference_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.preference_id')) VIRTUAL REFERENCES employer_preferences(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_employer_skill_weights_preference_id ON employer_skill_weights(preference_id);
CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
owner_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.owner_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE TABLE project_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE project_members (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
project_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.project_id')) VIRTUAL REFERENCES projects(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE TABLE challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
company_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.company_id')) VIRTUAL REFERENCES companies(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_challenges_company_id ON challenges(company_id);
CREATE TABLE challenge_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
challenge_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.challenge_id')) VIRTUAL REFERENCES challenges(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id);
CREATE INDEX idx_challenge_submissions_user_id ON challenge_submissions(user_id);
CREATE TABLE industry_evaluations (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE course_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
course_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.course_id')) VIRTUAL REFERENCES courses(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_course_skills_course_id ON course_skills(course_id);
CREATE TABLE career_roles (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE role_requirements (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
role_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.role_id')) VIRTUAL REFERENCES career_roles(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_role_requirements_role_id ON role_requirements(role_id);
CREATE TABLE skill_relationships (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE feed_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
post_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.post_id')) VIRTUAL REFERENCES feed_posts(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE TABLE likes (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE follows (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
from_user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.from_user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
to_user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.to_user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE TABLE notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE TABLE reputation (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE applications (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
opportunity_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.opportunity_id')) VIRTUAL REFERENCES opportunities(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE TABLE readiness_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE match_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
opportunity_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.opportunity_id')) VIRTUAL REFERENCES opportunities(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_match_scores_user_id ON match_scores(user_id);
CREATE INDEX idx_match_scores_opportunity_id ON match_scores(opportunity_id);
CREATE TABLE employer_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_employer_documents_user_id ON employer_documents(user_id);
CREATE TABLE social_links (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_social_links_user_id ON social_links(user_id);
CREATE TABLE saved_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
opportunity_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.opportunity_id')) VIRTUAL REFERENCES opportunities(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_saved_opportunities_user_id ON saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_opportunity_id ON saved_opportunities(opportunity_id);
CREATE TABLE course_completions (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
course_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.course_id')) VIRTUAL REFERENCES courses(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_course_completions_user_id ON course_completions(user_id);
CREATE INDEX idx_course_completions_course_id ON course_completions(course_id);
CREATE UNIQUE INDEX idx_users_email ON users(lower(json_extract(payload,'$.email')));
CREATE UNIQUE INDEX idx_profiles_user ON profiles(user_id);
CREATE UNIQUE INDEX idx_skills_name ON skills(lower(json_extract(payload,'$.name')));
CREATE UNIQUE INDEX idx_employee_skills_user_skill ON employee_skills(user_id,skill_id);
CREATE UNIQUE INDEX idx_applications_user_opportunity ON applications(user_id,opportunity_id);
CREATE UNIQUE INDEX idx_saved_user_opportunity ON saved_opportunities(user_id,opportunity_id);
CREATE UNIQUE INDEX idx_course_completion ON course_completions(user_id,course_id);
CREATE UNIQUE INDEX idx_session_token ON sessions(json_extract(payload,'$.token'));
