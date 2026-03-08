## 数据库初始化 SQL

如果需要使用Supabase数据库（而非localStorage），请在 Supabase SQL Editor 中运行以下SQL：

```sql
-- 漫剧用户资料表
CREATE TABLE IF NOT EXISTS manju_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  membership TEXT DEFAULT 'premium',
  credits INT DEFAULT 9999,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 漫剧项目表
CREATE TABLE IF NOT EXISTS manju_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  style TEXT DEFAULT 'anime',
  lines JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS策略
ALTER TABLE manju_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manju_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON manju_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_projects" ON manju_projects FOR ALL USING (auth.uid() = user_id);

-- 自动创建用户资料的trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO manju_profiles (id, username, membership, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'premium',
    9999
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

> 注意：即使不运行SQL，应用也能正常工作（使用localStorage存储）。
