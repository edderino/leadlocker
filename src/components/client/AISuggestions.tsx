'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Bell, TrendingUp, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

interface AISuggestionsProps {
  orgId: string;
}

interface SuggestionsResponse {
  success: boolean;
  suggestions: Suggestion[];
  generated_at: string;
  org_id: string;
}

// ========================================
// AI SUGGESTIONS COMPONENT
// ========================================

/**
 * AISuggestions Component
 * 
 * Displays AI-generated insights and recommendations based on recent leads and events.
 * 
 * Features:
 * - Auto-refresh every 60 seconds
 * - Displays top 3 actionable insights
 * - "Notify Me" button for push notifications
 * - Loading and empty states
 * - Priority-based styling
 * 
 * Usage:
 * <AISuggestions orgId="demo-org" />
 */
export default function AISuggestions({ orgId }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notifying, setNotifying] = useState(false);

  // ========================================
  // FETCH SUGGESTIONS
  // ========================================

  const fetchSuggestions = async () => {
    try {
      console.log(`[AISuggestions] Fetching suggestions for org: ${orgId}`);
      
      const response = await fetch(`/api/ai/suggestions?orgId=${orgId}`);
      const data: SuggestionsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      if (data.success) {
        setSuggestions(data.suggestions);
        setLastUpdated(new Date());
        setError(null);
        console.log(`[AISuggestions] Loaded ${data.suggestions.length} suggestions for org: ${orgId}`);
      } else {
        throw new Error('Failed to load suggestions');
      }

    } catch (err: any) {
      console.error('[AISuggestions] Error fetching suggestions:', err);
      setError(err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // SEND NOTIFICATION
  // ========================================

  const sendNotification = async () => {
    try {
      setNotifying(true);
      
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'test-secret-12345'
        },
        body: JSON.stringify({ orgId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[AISuggestions] Notification sent successfully');
        // Could show a toast here
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }

    } catch (err: any) {
      console.error('[AISuggestions] Error sending notification:', err);
      // Could show error toast here
    } finally {
      setNotifying(false);
    }
  };

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    fetchSuggestions();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchSuggestions, 60000);

    return () => clearInterval(interval);
  }, [orgId]);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  // ========================================
  // RENDER
  // ========================================

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            <p className="text-sm text-gray-500">Analyzing your data...</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            <p className="text-sm text-red-600">Failed to load suggestions</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          {error}
        </div>
        
        <button
          onClick={fetchSuggestions}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            <p className="text-sm text-gray-500">No suggestions available</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          We need more data to generate personalized insights. Keep adding leads to unlock AI recommendations!
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            <p className="text-sm text-gray-500">
              {lastUpdated ? `Updated ${formatLastUpdated(lastUpdated)}` : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuggestions}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh suggestions"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={sendNotification}
            disabled={notifying}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notifying ? 'Sending...' : 'Notify Me'}
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-2xl">{suggestion.icon}</div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {suggestion.title}
                  </h4>
                  {getPriorityIcon(suggestion.priority)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {suggestion.description}
                </p>
                
                <p className="text-xs text-gray-500 font-medium">
                  💡 {suggestion.action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          AI suggestions are generated every minute based on your recent leads and events
        </p>
      </div>
    </div>
  );
}
