import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { CategoriesView } from './components/CategoriesView';
import { DayToDayReportView } from './components/DayToDayReportView';
import { SerpExplorerView } from './components/SerpExplorerView';
import { ApiKeysView } from './components/ApiKeysView';
import { UserManagementView } from './components/UserManagementView';
import { AnalyticsView } from './components/AnalyticsView';
import { LogbookView } from './components/LogbookView';
import { LoginScreen } from './components/LoginScreen';
import { NewsTickerBar } from './components/NewsTickerBar';
import { ActiveTab, ApiKeyItem, ProjectItem, KeywordItem, SerpHistoryItem, DashboardData, SerpExplorerResponse, UserItem, CategoryItem, LogbookItem, NewsTickerItem, FeaturedKeywordItem, FeaturedKeywordStat } from './types';
import { playRankingSuccessSound } from './utils/sound';
import { apiGateway } from './utils/apiGateway';
import './styles/index.css';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => {
    const saved = localStorage.getItem('cekserp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('cekserp_token') || null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [keywordsMap, setKeywordsMap] = useState<Record<string, KeywordItem[]>>({});
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<SerpHistoryItem[]>([]);
  const [logbooks, setLogbooks] = useState<LogbookItem[]>([]);
  const [newsTickers, setNewsTickers] = useState<NewsTickerItem[]>([]);
  const [featuredStats, setFeaturedStats] = useState<FeaturedKeywordStat[]>([]);
  const [featuredKeywords, setFeaturedKeywords] = useState<FeaturedKeywordItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [failoverNotice, setFailoverNotice] = useState<string | null>(null);

  useEffect(() => {
    apiGateway.setOnFailoverListener((oldEp, newEp, accountName) => {
      setFailoverNotice(`⚠️ Akun Cloudflare Worker Utama (${oldEp}) terkena limit/error. Otomatis dialihkan ke ${accountName}!`);
    });
  }, []);

  // Helper fetch with Auth header & Automatic Gateway Failover across Cloudflare Accounts
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = authToken || (currentUser ? currentUser.id : '');
    return apiGateway.fetchWithFailover(url, options, token);
  };

  // Login handler
  const handleLogin = async (email: string, pass: string) => {
    const res = await apiGateway.fetchWithFailover('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);

    const user: UserItem = json.data.user;
    const token: string = json.data.token;

    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('cekserp_user', JSON.stringify(user));
    localStorage.setItem('cekserp_token', token);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('cekserp_user');
    localStorage.removeItem('cekserp_token');
    setActiveTab('dashboard');
  };

  // Load all app data
  const loadAllData = async () => {
    if (!currentUser || !authToken) return;
    setLoading(true);
    try {
      // 1. Fetch Categories
      const catRes = await authFetch('/api/categories');
      if (catRes.ok) {
        const catJson: any = await catRes.json();
        if (catJson.success) setCategories(catJson.data);
      }

      // 2. Fetch User's Own API Keys
      const keysRes = await authFetch('/api/keys');
      if (keysRes.ok) {
        const keysJson: any = await keysRes.json();
        if (keysJson.success) setApiKeys(keysJson.data);
      }

      // 3. Fetch Users (if Admin)
      if (currentUser.role === 'admin') {
        const usersRes = await authFetch('/api/admin/users');
        if (usersRes.ok) {
          const usersJson: any = await usersRes.json();
          if (usersJson.success) setUsersList(usersJson.data);
        }
      }

      // 4. Fetch Projects
      const projRes = await authFetch('/api/projects');
      if (projRes.ok) {
        const projJson: any = await projRes.json();
        if (projJson.success) {
          const projs: ProjectItem[] = projJson.data;
          setProjects(projs);

          const map: Record<string, KeywordItem[]> = {};
          for (const p of projs) {
            const kwRes = await authFetch(`/api/projects/${p.id}/keywords`);
            if (kwRes.ok) {
              const kwJson: any = await kwRes.json();
              if (kwJson.success) map[p.id] = kwJson.data;
            }
          }
          setKeywordsMap(map);
        }
      }

      // 5. Fetch Dashboard Analytics
      const dashRes = await authFetch('/api/analytics/dashboard');
      if (dashRes.ok) {
        const dashJson: any = await dashRes.json();
        if (dashJson.success) setDashboardData(dashJson.data);
      }

      // 6. Fetch History
      const histRes = await authFetch('/api/analytics/history');
      if (histRes.ok) {
        const histJson: any = await histRes.json();
        if (histJson.success) setHistory(histJson.data);
      }

      // 7. Fetch Logbooks
      const logRes = await authFetch('/api/workbooks');
      if (logRes.ok) {
        const logJson: any = await logRes.json();
        if (logJson.success) setLogbooks(logJson.data);
      }

      // 8. Fetch News Tickers
      const tickerUrl = currentUser.role === 'admin' ? '/api/admin/newstickers' : '/api/newstickers';
      const tickerRes = await authFetch(tickerUrl);
      if (tickerRes.ok) {
        const tickerJson: any = await tickerRes.json();
        if (tickerJson.success) setNewsTickers(tickerJson.data);
      }

      // 9. Fetch Featured Keywords Stats (for Dashboard)
      const featStatRes = await authFetch('/api/analytics/featured-keywords-stats');
      if (featStatRes.ok) {
        const featStatJson: any = await featStatRes.json();
        if (featStatJson.success) setFeaturedStats(featStatJson.data);
      }

      // 10. Fetch Featured Keywords (for Admin Management)
      if (currentUser.role === 'admin') {
        const featRes = await authFetch('/api/admin/featured-keywords');
        if (featRes.ok) {
          const featJson: any = await featRes.json();
          if (featJson.success) setFeaturedKeywords(featJson.data);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && authToken) {
      loadAllData();
    }
  }, [currentUser, authToken]);

  if (!currentUser || !authToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // --- ADMIN USER ACTIONS ---
  const handleAddUser = async (email: string, pass: string, name: string, role: 'admin' | 'user') => {
    const res = await authFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, name, role })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleEditUser = async (id: string, email: string, name: string, role: 'admin' | 'user', password?: string) => {
    const res = await authFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ email, name, role, password })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteUser = async (id: string) => {
    const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- CATEGORIES ACTIONS ---
  const handleAddCategory = async (name: string, description: string) => {
    const res = await authFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- PER-USER API KEY ACTIONS ---
  const handleAddApiKey = async (apiKey: string, label: string) => {
    const res = await authFetch('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey, label })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteApiKey = async (id: string) => {
    const res = await authFetch(`/api/keys/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleToggleApiKey = async (id: string, is_active: boolean) => {
    const res = await authFetch(`/api/keys/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ is_active })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleCheckQuota = async (id: string) => {
    const res = await authFetch(`/api/keys/${id}/check-quota`, { method: 'POST' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleCheckAllQuotas = async () => {
    const res = await authFetch('/api/keys/check-all-quotas', { method: 'POST' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- PROJECT ACTIONS ---
  const handleAddProject = async (
    name: string,
    target_url: string,
    category_id: string | null,
    country_code: string,
    keywords: string[]
  ) => {
    const res = await authFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, target_url, category_id, country_code, keywords })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteProject = async (id: string) => {
    // Project delete handler
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- LOGBOOK HANDLERS ---
  const handleAddLogbook = async (projectId: string, keywordId: string | null, actionType: string, description: string) => {
    const res = await authFetch('/api/workbooks', {
      method: 'POST',
      body: JSON.stringify({ projectId, keywordId, actionType, description })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleEditLogbook = async (id: string, actionType: string, description: string) => {
    const res = await authFetch(`/api/workbooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ actionType, description })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteLogbook = async (id: string) => {
    const res = await authFetch(`/api/workbooks/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- NEWS TICKER ACTIONS ---
  const handleAddNewsTicker = async (content: string, is_active: number) => {
    const res = await authFetch('/api/admin/newstickers', {
      method: 'POST',
      body: JSON.stringify({ content, is_active })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleEditNewsTicker = async (id: string, content: string, is_active: number) => {
    const res = await authFetch(`/api/admin/newstickers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content, is_active })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteNewsTicker = async (id: string) => {
    const res = await authFetch(`/api/admin/newstickers/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- FEATURED KEYWORD ACTIONS ---
  const handleAddFeaturedKeyword = async (keyword: string, is_active: number) => {
    const res = await authFetch('/api/admin/featured-keywords', {
      method: 'POST',
      body: JSON.stringify({ keyword, is_active })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleEditFeaturedKeyword = async (id: string, keyword: string, is_active: number) => {
    const res = await authFetch(`/api/admin/featured-keywords/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ keyword, is_active })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteFeaturedKeyword = async (id: string) => {
    const res = await authFetch(`/api/admin/featured-keywords/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleCheckFeaturedKeywordSerp = async (id: string) => {
    const res = await authFetch(`/api/admin/featured-keywords/${id}/check`, {
      method: 'POST'
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    playRankingSuccessSound();
    await loadAllData();
  };



  // --- KEYWORD ACTIONS ---
  const handleAddKeywords = async (projectId: string, keywords: string[]) => {
    const res = await authFetch(`/api/projects/${projectId}/keywords`, {
      method: 'POST',
      body: JSON.stringify({ keywords })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  const handleDeleteKeyword = async (id: string, projectId: string) => {
    const res = await authFetch(`/api/keywords/${id}`, { method: 'DELETE' });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    await loadAllData();
  };

  // --- SERP CHECK ACTIONS ---
  const handleCheckSerpSingle = async (keywordId: string, projectId: string) => {
    const res = await authFetch('/api/check-serp', {
      method: 'POST',
      body: JSON.stringify({ keywordId, projectId })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    playRankingSuccessSound();
    await loadAllData();
  };

  const handleCheckProjectSerp = async (projectId: string) => {
    const res = await authFetch('/api/check-project-serp', {
      method: 'POST',
      body: JSON.stringify({ projectId })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    playRankingSuccessSound();
    await loadAllData();
  };

  // --- SERP EXPLORER ---
  const handleExploreSerp = async (keyword: string, country: string, limit: number): Promise<SerpExplorerResponse> => {
    const res = await authFetch('/api/explore-serp', {
      method: 'POST',
      body: JSON.stringify({ keyword, country, limit })
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    playRankingSuccessSound();
    return json.data;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiKeys={apiKeys}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* News Ticker Bar (Shown to all users on all pages) */}
      <NewsTickerBar tickers={newsTickers} />

      {/* Cloudflare Multi-Account Failover Notice */}
      {failoverNotice && (
        <div className="bg-amber-500/20 border-y border-amber-500/40 px-4 py-2 text-amber-300 text-xs font-semibold flex items-center justify-between z-20">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="shrink-0 animate-bounce">⚡</span>
            <span>{failoverNotice}</span>
          </div>
          <button onClick={() => setFailoverNotice(null)} className="text-amber-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            featuredStats={featuredStats}
            loading={loading}
            setActiveTab={setActiveTab}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            keywords={keywordsMap}
            categories={categories}
            users={usersList}
            currentUser={currentUser}
            loading={loading}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onAddKeywords={handleAddKeywords}
            onDeleteKeyword={handleDeleteKeyword}
            onCheckSerpSingle={handleCheckSerpSingle}
            onCheckProjectSerp={handleCheckProjectSerp}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            loading={loading}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'logbooks' && (
          <LogbookView
            logbooks={logbooks}
            projects={projects}
            currentUser={currentUser!}
            onAdd={handleAddLogbook}
            onEdit={handleEditLogbook}
            onDelete={handleDeleteLogbook}
          />
        )}

        {activeTab === 'daytoday' && (
          <DayToDayReportView
            history={history}
            projects={projects}
            keywords={Object.values(keywordsMap).flat()}
            logbooks={logbooks}
            loading={loading}
            onAddLogbook={handleAddLogbook}
            onEditLogbook={handleEditLogbook}
            onDeleteLogbook={handleDeleteLogbook}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            history={history}
            projects={projects}
            keywords={Object.values(keywordsMap).flat()}
          />
        )}

        {activeTab === 'explorer' && (
          <SerpExplorerView
            onExploreSerp={handleExploreSerp}
          />
        )}

        {activeTab === 'apikeys' && (
          <ApiKeysView
            apiKeys={apiKeys}
            currentUser={currentUser}
            loading={loading}
            onAddApiKey={handleAddApiKey}
            onDeleteApiKey={handleDeleteApiKey}
            onToggleApiKey={handleToggleApiKey}
            onCheckQuota={handleCheckQuota}
            onCheckAllQuotas={handleCheckAllQuotas}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UserManagementView
            users={usersList}
            newsTickers={newsTickers}
            featuredKeywords={featuredKeywords}
            currentUser={currentUser}
            loading={loading}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onAddNewsTicker={handleAddNewsTicker}
            onEditNewsTicker={handleEditNewsTicker}
            onDeleteNewsTicker={handleDeleteNewsTicker}
            onAddFeaturedKeyword={handleAddFeaturedKeyword}
            onEditFeaturedKeyword={handleEditFeaturedKeyword}
            onDeleteFeaturedKeyword={handleDeleteFeaturedKeyword}
            onCheckFeaturedKeywordSerp={handleCheckFeaturedKeywordSerp}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span>Cek SERP Online &copy; 2026 • Full Stack Cloudflare Pages + Workers + D1</span>
            <span className="text-[10px] bg-slate-900 text-indigo-400 border border-slate-800 px-2 py-0.5 rounded font-mono">
              Node: {apiGateway.getActiveAccountName()}
            </span>
          </div>
          <div className="text-slate-600 font-mono">
            Per-User API Keys Active ({apiKeys.length}/4 Keys) | Mode: {currentUser.role.toUpperCase()} ({currentUser.name})
          </div>
        </div>
      </footer>

    </div>
  );
}
