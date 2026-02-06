"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/component/DashboardLayout';
import LeftSidebar from '@/component/LeftSidebar';
import { useAuth } from '@clerk/nextjs';

// TypeScript interfaces for API responses
interface OverallStats {
  totalChatBots: number;
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  activeChatBots: number;
  activeConversationsToday: number;
  totalKnowledgeBases: number;
}

interface ChatBotStats {
  totalChatBots: number;
  chatBotsByStatus: Record<string, number>;
  chatBotsCreatedToday: number;
  chatBotsCreatedThisWeek: number;
  chatBotsCreatedThisMonth: number;
  averageChatBotsPerUser: number;
  chatBotsByDataSource: Record<string, number>;
}

interface ConversationStats {
  totalConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;
  averageMessagesPerConversation: number;
  longestConversation: number;
  conversationsByMode: Record<string, number>;
  anonymousConversations: number;
  authenticatedConversations: number;
}

interface UsageStats {
  totalMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageMessagesPerDay: number;
  peakMessagesInDay: number;
  messagesByHour: Record<string, number>;
  totalUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
}

interface TimeSeriesData {
  date: string;
  conversations: number;
  messages: number;
  users: number;
  chatBots: number;
}

interface TopChatBot {
  chatBotId: string;
  chatBotName: string;
  chatBotTitle: string;
  conversationCount: number;
  messageCount: number;
  uniqueUsers: number;
  status: string;
  createdBy: string;
}

interface UserActivity {
  email: string;
  conversationCount: number;
  messageCount: number;
  chatBotsCreated: number;
  lastActivityDate: string;
}

interface DashboardStatsResponse {
  overallStats: OverallStats;
  chatBotStats: ChatBotStats;
  conversationStats: ConversationStats;
  usageStats: UsageStats;
  usageOverTime: TimeSeriesData[];
  topChatBots: TopChatBot[];
  topActiveUsers: UserActivity[];
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  overallStats: 'dashboard_overall_stats',
  chatBotStats: 'dashboard_chatbot_stats',
  conversationStats: 'dashboard_conversation_stats',
  usageStats: 'dashboard_usage_stats',
  usageOverTime: 'dashboard_usage_over_time',
  topChatBots: 'dashboard_top_chatbots',
  topActiveUsers: 'dashboard_top_active_users',
};

// Cache utility functions
const getCachedData = <T,>(key: string): { data: T; timestamp: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const now = Date.now();
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
};

const setCachedData = <T,>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
};

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Separate states for each section
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [chatBotStats, setChatBotStats] = useState<ChatBotStats | null>(null);
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usageOverTime, setUsageOverTime] = useState<TimeSeriesData[] | null>(null);
  const [topChatBots, setTopChatBots] = useState<TopChatBot[] | null>(null);
  const [topActiveUsers, setTopActiveUsers] = useState<UserActivity[] | null>(null);
  
  // Loading states for each section
  const [loadingStates, setLoadingStates] = useState({
    overallStats: false,
    chatBotStats: false,
    conversationStats: false,
    usageStats: false,
    usageOverTime: false,
    topChatBots: false,
    topActiveUsers: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { getToken } = useAuth();

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (_itemName: string, _itemHref: string) => {
    // Navigation handled within sidebar component for dashboard links
  };

  // Generic fetch function with caching
  const fetchWithCache = useCallback(async (
    endpoint: string,
    cacheKey: string,
    setData: (data: any) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
  ) => {
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(cached.data);
      setLoading(false);
      // Still fetch in background to update cache
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add bearer token if user is signed in
      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      setCachedData(cacheKey, data);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // If we have cached data, keep showing it even if fetch fails
      if (!cached) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch all sections independently
  useEffect(() => {
    // Load overall stats first (most important)
    fetchWithCache(
      '/v1/api/dashboard/stats/overall',
      CACHE_KEYS.overallStats,
      setOverallStats,
      (loading) => setLoadingStates(prev => ({ ...prev, overallStats: loading })),
      (error) => setErrors(prev => ({ ...prev, overallStats: error || '' }))
    );

    // Load other sections in parallel
    fetchWithCache(
      '/v1/api/dashboard/stats/chatbots',
      CACHE_KEYS.chatBotStats,
      setChatBotStats,
      (loading) => setLoadingStates(prev => ({ ...prev, chatBotStats: loading })),
      (error) => setErrors(prev => ({ ...prev, chatBotStats: error || '' }))
    );

    fetchWithCache(
      '/v1/api/dashboard/stats/conversations',
      CACHE_KEYS.conversationStats,
      setConversationStats,
      (loading) => setLoadingStates(prev => ({ ...prev, conversationStats: loading })),
      (error) => setErrors(prev => ({ ...prev, conversationStats: error || '' }))
    );

    fetchWithCache(
      '/v1/api/dashboard/stats/usage',
      CACHE_KEYS.usageStats,
      setUsageStats,
      (loading) => setLoadingStates(prev => ({ ...prev, usageStats: loading })),
      (error) => setErrors(prev => ({ ...prev, usageStats: error || '' }))
    );

    fetchWithCache(
      '/v1/api/dashboard/stats/usage-over-time?days=30',
      CACHE_KEYS.usageOverTime,
      setUsageOverTime,
      (loading) => setLoadingStates(prev => ({ ...prev, usageOverTime: loading })),
      (error) => setErrors(prev => ({ ...prev, usageOverTime: error || '' }))
    );

    fetchWithCache(
      '/v1/api/dashboard/top/chatbots?limit=10',
      CACHE_KEYS.topChatBots,
      setTopChatBots,
      (loading) => setLoadingStates(prev => ({ ...prev, topChatBots: loading })),
      (error) => setErrors(prev => ({ ...prev, topChatBots: error || '' }))
    );

    fetchWithCache(
      '/v1/api/dashboard/top/users?limit=10',
      CACHE_KEYS.topActiveUsers,
      setTopActiveUsers,
      (loading) => setLoadingStates(prev => ({ ...prev, topActiveUsers: loading })),
      (error) => setErrors(prev => ({ ...prev, topActiveUsers: error || '' }))
    );
  }, [fetchWithCache]);

  // Format numbers with commas
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US');
  };

  // Calculate percentage
  const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Get peak hour from messagesByHour
  const getPeakHour = (messagesByHour: Record<string, number> | undefined): string => {
    if (!messagesByHour) return 'N/A';
    const entries = Object.entries(messagesByHour);
    if (entries.length === 0) return 'N/A';
    const peak = entries.reduce((max, [hour, count]) => 
      count > max[1] ? [hour, count] : max
    );
    return `${peak[0]}:00`;
  };

  const stats = useMemo(
    () => {
      if (!overallStats) return [];
      
      return [
        { 
          label: 'Total Chatbots', 
          value: formatNumber(overallStats.totalChatBots), 
          accent: '#00d9ff',
          loading: loadingStates.overallStats
        },
        { 
          label: 'Total Conversations', 
          value: formatNumber(overallStats.totalConversations), 
          accent: '#00d9ff',
          loading: loadingStates.overallStats
        },
        { 
          label: 'Total Messages', 
          value: formatNumber(overallStats.totalMessages), 
          accent: '#00d9ff',
          loading: loadingStates.overallStats
        },
        { 
          label: 'Total Users', 
          value: formatNumber(overallStats.totalUsers), 
          accent: '#00d9ff',
          loading: loadingStates.overallStats
        },
      ];
    },
    [overallStats, loadingStates.overallStats]
  );

  const usageMetrics = useMemo(
    () => {
      if (!usageStats || !conversationStats || !overallStats) return [];
      
      return [
        { 
          label: 'Messages Today', 
          value: formatNumber(usageStats.messagesToday), 
          icon: '💬',
          loading: loadingStates.usageStats
        },
        { 
          label: 'Conversations Today', 
          value: formatNumber(conversationStats.conversationsToday), 
          icon: '📊',
          loading: loadingStates.conversationStats
        },
        { 
          label: 'Active Users Today', 
          value: formatNumber(usageStats.activeUsersToday), 
          icon: '👥',
          loading: loadingStates.usageStats
        },
        { 
          label: 'Active Chatbots', 
          value: formatNumber(overallStats.activeChatBots), 
          icon: '🤖',
          loading: loadingStates.overallStats
        },
        { 
          label: 'Knowledge Bases', 
          value: formatNumber(overallStats.totalKnowledgeBases), 
          icon: '📚',
          loading: loadingStates.overallStats
        },
      ];
    },
    [usageStats, conversationStats, overallStats, loadingStates]
  );

  const quickActions = useMemo(
    () => [
      { 
        title: 'View Chatbots', 
        description: `${formatNumber(overallStats?.totalChatBots || 0)} chatbots available`, 
        theme: '#00d9ff',
        href: '/ai-chatbots'
      },
      { 
        title: 'View Conversations', 
        description: `${formatNumber(conversationStats?.conversationsToday || 0)} conversations today`, 
        theme: '#00d9ff',
        href: '/history'
      },
      { 
        title: 'Create Chatbot', 
        description: 'Build a new AI chatbot for your needs.', 
        theme: '#00d9ff',
        href: '/ai-chatbots'
      },
      { 
        title: 'Analytics', 
        description: 'View detailed analytics and insights.', 
        theme: '#00d9ff',
        href: '/support-chat/analytics'
      },
    ],
    [overallStats, conversationStats]
  );

  return (
    <DashboardLayout>
      <div className="dashboard-shell">
        <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />

        <main className={`dashboard-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <>
            {/* Platform Overview Section - Shows immediately if cached, otherwise shows loading */}
            <section className="top-grid">
              <div className="plan-card">
                <div className="plan-header">
                  <h2>Platform Overview</h2>
                  <span className="plan-cta">Active Today</span>
                </div>
                {overallStats && conversationStats ? (
                  <div className="plan-counter">
                    <div>
                      <div className="plan-total">
                        {formatNumber(overallStats.activeConversationsToday)}
                      </div>
                      <p className="plan-meta">Active Conversations</p>
                    </div>
                    <div className="plan-progress">
                      <div className="plan-progress-bar">
                        <div 
                          className="plan-progress-fill"
                          style={{ 
                            width: `${calculatePercentage(
                              overallStats.activeConversationsToday,
                              conversationStats.conversationsThisWeek || 1
                            )}%` 
                          }}
                        />
                      </div>
                      <div className="plan-progress-labels">
                        <span>Today</span>
                        <span>This Week: {formatNumber(conversationStats.conversationsThisWeek)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="plan-counter">
                    <div>
                      <div className="plan-total skeleton-text" style={{ width: '120px', height: '40px' }}></div>
                      <p className="plan-meta skeleton-text" style={{ width: '150px', height: '16px', marginTop: '8px' }}></p>
                    </div>
                    <div className="plan-progress">
                      <div className="plan-progress-bar">
                        <div className="plan-progress-fill skeleton" style={{ width: '60%' }}></div>
                      </div>
                      <div className="plan-progress-labels">
                        <span className="skeleton-text" style={{ width: '60px', height: '12px' }}></span>
                        <span className="skeleton-text" style={{ width: '120px', height: '12px' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                <div className="quick-actions">
                  {quickActions.map((action) => (
                    <div key={action.title} className="quick-card">
                      <div className="quick-pill" style={{ backgroundColor: action.theme ?? '#f1f5f9' }} />
                      <div>
                        <h3>{action.title}</h3>
                        <p>{action.description}</p>
                      </div>
                      <a href={action.href} className="quick-button">View More</a>
                    </div>
                  ))}
                </div>
              </section>

              <section className="search-section">
                <div className="search-left">
                  <h2>Hey, What can I do for you today?</h2>
                  <p>Search for documents, templates and chatbots…</p>
                  <div className="search-input">
                    <span role="img" aria-label="search">
                      🔍
                    </span>
                    <input placeholder="Search for documents, templates and chatbots" />
                    <button type="button" className="search-voice">
                      🎙️
                    </button>
                  </div>
                </div>
                <a href="/ai-chatbots" className="new-doc-btn">
                  + Create a new chatbot
                </a>
              </section>

              {/* Metrics Row - Shows immediately if cached */}
              <section className="metrics-row">
                {stats.length > 0 ? (
                  stats.map((stat) => (
                    <div key={stat.label} className="metric-card">
                      <span className="metric-label">{stat.label}</span>
                      {stat.loading && !overallStats ? (
                        <div className="metric-value skeleton-text" style={{ width: '100px', height: '32px' }}></div>
                      ) : (
                        <div className="metric-value" style={{ color: stat.accent }}>
                          {stat.value}
                        </div>
                      )}
                      <a href="#" className="metric-link">
                        View Details
                      </a>
                    </div>
                  ))
                ) : (
                  // Show skeleton while loading
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="metric-card">
                      <span className="metric-label skeleton-text" style={{ width: '120px', height: '16px' }}></span>
                      <div className="metric-value skeleton-text" style={{ width: '100px', height: '32px', marginTop: '8px' }}></div>
                      <a href="#" className="metric-link skeleton-text" style={{ width: '80px', height: '14px', marginTop: '8px' }}></a>
                    </div>
                  ))
                )}
              </section>

              {/* Usage Section - Shows immediately if cached */}
              {usageStats && conversationStats && overallStats ? (
                <section className="usage-section">
                  <div className="usage-header">
                    <h2>Usage Statistics</h2>
                    <div className="usage-summary">
                      <span>Peak Hour: {getPeakHour(usageStats.messagesByHour)}</span>
                      <span>Avg/Day: {formatNumber(usageStats.averageMessagesPerDay)}</span>
                    </div>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-bar-fill"
                      style={{ 
                        width: `${calculatePercentage(
                          usageStats.messagesToday,
                          usageStats.peakMessagesInDay || 1
                        )}%` 
                      }}
                    />
                  </div>
                  <div className="usage-metrics">
                    {usageMetrics.map((item) => (
                      <div key={item.label} className="usage-item">
                        <span className="usage-icon">{item.icon}</span>
                        <div>
                          <div className="usage-value">{item.value}</div>
                          <div className="usage-label">{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="usage-section">
                  <div className="usage-header">
                    <h2>Usage Statistics</h2>
                    <div className="usage-summary">
                      <span className="skeleton-text" style={{ width: '100px', height: '14px' }}></span>
                      <span className="skeleton-text" style={{ width: '80px', height: '14px' }}></span>
                    </div>
                  </div>
                  <div className="usage-bar">
                    <div className="usage-bar-fill skeleton" style={{ width: '60%' }}></div>
                  </div>
                  <div className="usage-metrics">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="usage-item">
                        <span className="usage-icon">⏳</span>
                        <div>
                          <div className="usage-value skeleton-text" style={{ width: '60px', height: '18px' }}></div>
                          <div className="usage-label skeleton-text" style={{ width: '100px', height: '14px', marginTop: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Top Chatbots and Top Users - Show immediately if cached */}
              <section className="two-column">
                <div className="assistants-card">
                  <div className="section-header">
                    <h2>Top Chatbots</h2>
                    <a href="/ai-chatbots" className="section-link">View all</a>
                  </div>
                  {topChatBots ? (
                    <div className="assistants-grid">
                      {topChatBots.slice(0, 4).map((chatbot) => (
                        <div key={chatbot.chatBotId} className="assistant-card" style={{ backgroundColor: '#f4f0ff' }}>
                          <div className="assistant-top">
                            <div className="assistant-avatar" style={{ borderColor: '#9a8cff' }}>
                              {chatbot.chatBotTitle
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="assistant-tag" style={{ backgroundColor: '#9a8cff' }}>
                              {chatbot.status}
                            </span>
                          </div>
                          <div>
                            <h3>{chatbot.chatBotTitle}</h3>
                            <p>{formatNumber(chatbot.conversationCount)} conversations</p>
                          </div>
                          <a href={`/ai-chatbots/${chatbot.chatBotId}`} className="assistant-cta">
                            View Details
                          </a>
                        </div>
                      ))}
                      {topChatBots.length === 0 && (
                        <div className="empty-state">
                          <p>No chatbots yet. Create your first chatbot!</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="assistants-grid">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="assistant-card" style={{ backgroundColor: '#f4f0ff' }}>
                          <div className="assistant-top">
                            <div className="assistant-avatar skeleton" style={{ borderColor: '#9a8cff', width: '48px', height: '48px' }}></div>
                            <span className="assistant-tag skeleton-text" style={{ width: '60px', height: '24px' }}></span>
                          </div>
                          <div>
                            <h3 className="skeleton-text" style={{ width: '120px', height: '20px' }}></h3>
                            <p className="skeleton-text" style={{ width: '100px', height: '16px', marginTop: '8px' }}></p>
                          </div>
                          <div className="assistant-cta skeleton-text" style={{ width: '100px', height: '36px' }}></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="templates-card">
                  <div className="section-header">
                    <h2>Top Active Users</h2>
                    <a href="#" className="section-link">View all</a>
                  </div>
                  {topActiveUsers ? (
                    <div className="template-list">
                      {topActiveUsers.slice(0, 4).map((user) => (
                        <div key={user.email} className="template-item">
                          <div>
                            <h3>{user.email}</h3>
                            <p>
                              {formatNumber(user.conversationCount)} conversations · {formatNumber(user.messageCount)} messages
                            </p>
                          </div>
                          <span className="user-badge">
                            {formatNumber(user.chatBotsCreated)} bots
                          </span>
                        </div>
                      ))}
                      {topActiveUsers.length === 0 && (
                        <div className="empty-state">
                          <p>No user activity data available.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="template-list">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="template-item">
                          <div>
                            <h3 className="skeleton-text" style={{ width: '180px', height: '18px' }}></h3>
                            <p className="skeleton-text" style={{ width: '200px', height: '14px', marginTop: '6px' }}></p>
                          </div>
                          <span className="user-badge skeleton-text" style={{ width: '60px', height: '32px' }}></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Time Series Chart Section - Shows immediately if cached */}
              {usageOverTime && usageOverTime.length > 0 ? (
                <section className="chart-section">
                  <div className="chart-card">
                    <div className="section-header">
                      <h2>Usage Over Time (Last 30 Days)</h2>
                      <div className="chart-legend">
                        <span className="legend-item" style={{ color: '#00d9ff' }}>● Conversations</span>
                        <span className="legend-item" style={{ color: '#00d9ff' }}>● Messages</span>
                        <span className="legend-item" style={{ color: '#00d9ff' }}>● Users</span>
                      </div>
                    </div>
                    <div className="chart-container">
                      <div className="chart-bars">
                        {usageOverTime.slice(-30).map((data, index) => {
                          const maxValue = Math.max(
                            ...usageOverTime.slice(-30).map(d => 
                              Math.max(d.conversations, d.messages, d.users)
                            )
                          );
                          const conversationsHeight = maxValue > 0 ? (data.conversations / maxValue) * 100 : 0;
                          const messagesHeight = maxValue > 0 ? (data.messages / maxValue) * 100 : 0;
                          const usersHeight = maxValue > 0 ? (data.users / maxValue) * 100 : 0;
                          
                          return (
                            <div key={index} className="chart-bar-group">
                              <div className="chart-bar-wrapper">
                                <div 
                                  className="chart-bar conversations-bar"
                                  style={{ height: `${conversationsHeight}%` }}
                                  title={`Conversations: ${data.conversations}`}
                                />
                                <div 
                                  className="chart-bar messages-bar"
                                  style={{ height: `${messagesHeight}%` }}
                                  title={`Messages: ${data.messages}`}
                                />
                                <div 
                                  className="chart-bar users-bar"
                                  style={{ height: `${usersHeight}%` }}
                                  title={`Users: ${data.users}`}
                                />
                              </div>
                              <span className="chart-label">
                                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              ) : loadingStates.usageOverTime ? (
                <section className="chart-section">
                  <div className="chart-card">
                    <div className="section-header">
                      <h2>Usage Over Time (Last 30 Days)</h2>
                      <div className="chart-legend">
                        <span className="skeleton-text" style={{ width: '120px', height: '14px' }}></span>
                        <span className="skeleton-text" style={{ width: '100px', height: '14px' }}></span>
                        <span className="skeleton-text" style={{ width: '80px', height: '14px' }}></span>
                      </div>
                    </div>
                    <div className="chart-container">
                      <div className="chart-bars">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div key={i} className="chart-bar-group">
                            <div className="chart-bar-wrapper">
                              <div className="chart-bar skeleton" style={{ height: `${Math.random() * 100}%` }}></div>
                              <div className="chart-bar skeleton" style={{ height: `${Math.random() * 100}%` }}></div>
                              <div className="chart-bar skeleton" style={{ height: `${Math.random() * 100}%` }}></div>
                            </div>
                            <span className="chart-label skeleton-text" style={{ width: '40px', height: '12px' }}></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Additional Stats Section - Shows immediately if cached */}
              {chatBotStats && conversationStats ? (
                <section className="stats-grid">
                  <div className="stat-card">
                    <h3>Chatbot Status Distribution</h3>
                    <div className="stat-distribution">
                      {Object.entries(chatBotStats.chatBotsByStatus).map(([status, count]) => (
                        <div key={status} className="stat-item">
                          <span className="stat-label">{status}</span>
                          <span className="stat-value">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stat-card">
                    <h3>Conversation Modes</h3>
                    <div className="stat-distribution">
                      {Object.entries(conversationStats.conversationsByMode).map(([mode, count]) => (
                        <div key={mode} className="stat-item">
                          <span className="stat-label">{mode}</span>
                          <span className="stat-value">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stat-card">
                    <h3>Data Sources</h3>
                    <div className="stat-distribution">
                      {Object.entries(chatBotStats.chatBotsByDataSource).map(([source, count]) => (
                        <div key={source} className="stat-item">
                          <span className="stat-label">{source}</span>
                          <span className="stat-value">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <section className="stats-grid">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="stat-card">
                      <h3 className="skeleton-text" style={{ width: '180px', height: '20px' }}></h3>
                      <div className="stat-distribution">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="stat-item">
                            <span className="stat-label skeleton-text" style={{ width: '100px', height: '16px' }}></span>
                            <span className="stat-value skeleton-text" style={{ width: '50px', height: '18px' }}></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
        </main>
      </div>

      <style jsx>{`
        .dashboard-shell {
          display: flex;
          min-height: 100vh;
          background: #0a0e27;
        }

        .dashboard-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          background: #0f1419;
          transition: margin-left 0.3s ease;
        }

        .dashboard-main.collapsed {
          margin-left: 60px;
        }

        /* Skeleton Loading Styles */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        .skeleton-text {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s ease-in-out infinite;
          border-radius: 4px;
          display: inline-block;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .top-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .plan-card {
          background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
          color: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 24px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid #2a3340;
        }

        .plan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .plan-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .plan-cta {
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
        }

        .plan-counter {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .plan-total {
          font-size: 34px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .plan-meta {
          margin: 4px 0 0;
          font-size: 13px;
          opacity: 0.8;
        }

        .plan-progress {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .plan-progress-bar {
          width: 100%;
          height: 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .plan-progress-fill {
          position: absolute;
          inset: 0;
          background: #93c5fd;
          transition: width 0.3s ease;
        }

        .plan-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          opacity: 0.75;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .quick-card {
          background: #1a1f2e;
          border-radius: 20px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          border: 1px solid #2a3340;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3);
        }

        .quick-card h3 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .quick-card p {
          margin: 0;
          font-size: 13px;
          color: #a0aac0;
        }

        .quick-button {
          border: none;
          background: rgba(0, 217, 255, 0.1);
          color: #00d9ff;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .quick-pill {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(148, 163, 184, 0.2);
        }

        .search-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 26px;
          background: #1a1f2e;
          border: 1px solid #2a3340;
          border-radius: 24px;
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.3);
          margin-bottom: 24px;
        }

        .search-left h2 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .search-left p {
          margin: 0 0 20px;
          color: #a0aac0;
          font-size: 14px;
        }

        .search-input {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0f1419;
          border-radius: 999px;
          padding: 12px 18px;
          border: 1px solid #2a3340;
        }

        .search-input input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          outline: none;
          color: #ffffff;
        }

        .search-input input::placeholder {
          color: #a0aac0;
        }

        .search-voice {
          border: none;
          background: #1a1f2e;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
        }

        .new-doc-btn {
          border: none;
          background: #00d9ff;
          color: #000;
          padding: 14px 20px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 20px 30px rgba(0, 217, 255, 0.25);
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #1a1f2e;
          border-radius: 20px;
          padding: 18px;
          border: 1px solid #2a3340;
          box-shadow: 0 16px 28px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metric-label {
          font-size: 13px;
          color: #a0aac0;
          font-weight: 500;
        }

        .metric-value {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #00d9ff;
        }

        .metric-link {
          font-size: 12px;
          color: #1d4ed8;
          text-decoration: none;
          font-weight: 600;
        }

        .usage-section {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.85);
          padding: 22px;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.05);
          margin-bottom: 24px;
        }

        .usage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .usage-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .usage-summary {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #a0aac0;
        }

        .usage-bar {
          width: 100%;
          height: 14px;
          border-radius: 999px;
          background: #0f1419;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
          border: 1px solid #2a3340;
        }

        .usage-bar-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #00d9ff 0%, #0099cc 100%);
          transition: width 0.3s ease;
        }

        .usage-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .usage-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .usage-icon {
          font-size: 20px;
        }

        .usage-value {
          font-weight: 700;
          color: #0f172a;
          font-size: 15px;
        }

        .usage-label {
          font-size: 13px;
          color: #64748b;
        }

        .two-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .assistants-card,
        .templates-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 22px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .section-link {
          border: none;
          background: rgba(0, 217, 255, 0.1);
          color: #00d9ff;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }

        .assistants-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .assistant-card {
          border-radius: 20px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .assistant-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .assistant-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: #0f172a;
          background: #ffffff;
          border-width: 3px;
          border-style: solid;
        }

        .assistant-tag {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          color: #ffffff;
          background: #00d9ff;
        }

        .assistant-card h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .assistant-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .assistant-cta {
          align-self: flex-start;
          border: none;
          background: #00d9ff;
          color: #000;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 14px 24px rgba(0, 217, 255, 0.25);
          text-decoration: none;
          display: inline-block;
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .template-item {
          background: #0f1419;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border: 1px solid #2a3340;
        }

        .template-item h3 {
          margin: 0 0 6px;
          font-size: 15px;
          color: #ffffff;
        }

        .template-item p {
          margin: 0;
          font-size: 13px;
          color: #a0aac0;
        }

        .user-badge {
          background: #1a1f2e;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #00d9ff;
          box-shadow: 0 12px 20px rgba(0, 217, 255, 0.18);
          border: 1px solid #2a3340;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.05);
        }

        .stat-card h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-distribution {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          text-transform: capitalize;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .chart-section {
          margin-bottom: 24px;
        }

        .chart-card {
          background: #1a1f2e;
          border-radius: 24px;
          padding: 22px;
          border: 1px solid #2a3340;
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.3);
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          font-size: 13px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #a0aac0;
        }

        .chart-container {
          margin-top: 24px;
          padding: 20px 0;
          overflow-x: auto;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 200px;
          padding-bottom: 40px;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 30px;
        }

        .chart-bar-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          width: 100%;
          height: 200px;
          position: relative;
        }

        .chart-bar {
          flex: 1;
          min-width: 8px;
          border-radius: 4px 4px 0 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .chart-bar:hover {
          opacity: 0.8;
        }

        .conversations-bar {
          background: #2563eb;
        }

        .messages-bar {
          background: #0ea5e9;
        }

        .users-bar {
          background: #6366f1;
        }

        .chart-label {
          font-size: 11px;
          color: #64748b;
          text-align: center;
          writing-mode: horizontal-tb;
          transform: rotate(-45deg);
          transform-origin: center;
          white-space: nowrap;
        }

        @media (max-width: 1280px) {
          .top-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1024px) {
          .metrics-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .two-column {
            grid-template-columns: 1fr;
          }

          .assistants-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
            padding: 1.25rem;
          }

          .search-section {
            flex-direction: column;
            align-items: stretch;
          }

          .new-doc-btn {
            width: 100%;
          }

          .metrics-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
