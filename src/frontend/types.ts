export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface CategoryItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  project_count?: number;
  user_name?: string;
}

export interface ApiKeyItem {
  id: string;
  api_key: string;
  label: string;
  is_active: number;
  usage_count: number;
  last_used_at: string | null;
  remaining_quota?: number | null;
  total_quota?: number | null;
  quota_updated_at?: string | null;
  plan_name?: string | null;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  target_url: string;
  country_code: string;
  language_code: string;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  user_name?: string;
  user_email?: string;
  keyword_count?: number;
  avg_position?: number | null;
}

export interface KeywordItem {
  id: string;
  project_id: string;
  keyword: string;
  created_at: string;
  latest_position?: number | null;
  previous_position?: number | null;
  found_url?: string | null;
  page_number?: number | null;
  checked_at?: string | null;
}

export interface SerpHistoryItem {
  id: string;
  keyword_id: string;
  project_id: string;
  position: number | null;
  found_url: string | null;
  page_number: number | null;
  api_key_used: string | null;
  checked_at: string;
  keyword?: string;
  project_name?: string;
  target_url?: string;
  category_name?: string;
  user_name?: string;
}

export interface DashboardData {
  totalProjects: number;
  totalKeywords: number;
  avgPosition: number | null;
  trackedCount: number;
  distribution: {
    top3: number;
    top10: number;
    top30: number;
    top100: number;
    notInTop100: number;
  };
  movement: {
    up: number;
    down: number;
    unchanged: number;
  };
  recentChecks: SerpHistoryItem[];
}

export interface SerpOrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link?: string;
  snippet?: string;
  sitelinks?: { title: string; link: string }[];
}

export interface SerpExplorerResponse {
  keyword: string;
  country: string;
  total_results?: string;
  results: SerpOrganicResult[];
  checked_at: string;
  api_key_used: string;
}

export interface LogbookItem {
  id: string;
  user_id: string;
  project_id: string;
  keyword_id?: string | null;
  action_type: string;
  description: string | null;
  created_at: string;
  project_name?: string;
  user_name?: string;
}

export interface NewsTickerItem {
  id: string;
  content: string;
  is_active: number;
  created_at: string;
}

export interface FeaturedKeywordTop10Result {
  position: number;
  title: string;
  link: string;
  displayed_link?: string;
  snippet?: string;
  is_our_project: boolean;
  project_id?: string;
  project_name?: string;
  target_url?: string;
}

export interface FeaturedKeywordItem {
  id: string;
  keyword: string;
  is_active: number;
  last_checked_at?: string | null;
  top10_count?: number;
  serp_data?: string | null;
  created_at: string;
}

export interface FeaturedKeywordStat {
  id: string;
  keyword: string;
  is_active: number;
  last_checked_at?: string | null;
  top10Count: number;
  totalResults: number;
  percentage: number;
  top10Results: FeaturedKeywordTop10Result[];
}

export type ActiveTab = 'dashboard' | 'projects' | 'categories' | 'daytoday' | 'analytics' | 'explorer' | 'logbooks' | 'apikeys' | 'users';
