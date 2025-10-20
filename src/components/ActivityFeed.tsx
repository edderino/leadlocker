'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Event {
  id: string;
  event_type: string;
  actor_id: string;
  lead_id: string | null;
  metadata: any;
  created_at: string;
}

interface GroupedEvents {
  today: Event[];
  yesterday: Event[];
  older: Event[];
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string; bgColor: string }> = {
  'lead.created': { 
    icon: '🟢', 
    color: 'text-green-700', 
    label: 'Lead Created',
    bgColor: 'bg-green-50'
  },
  'lead.status_updated': { 
    icon: '🟡', 
    color: 'text-yellow-700', 
    label: 'Status Updated',
    bgColor: 'bg-yellow-50'
  },
  'sms.sent': { 
    icon: '🟣', 
    color: 'text-purple-700', 
    label: 'SMS Sent',
    bgColor: 'bg-purple-50'
  },
  'summary.sent': { 
    icon: '🔵', 
    color: 'text-blue-700', 
    label: 'Summary Sent',
    bgColor: 'bg-blue-50'
  },
  'cleanup.run': { 
    icon: '🔵', 
    color: 'text-blue-700', 
    label: 'Cleanup Run',
    bgColor: 'bg-blue-50'
  },
  'error.alert': { 
    icon: '⚠️', 
    color: 'text-red-700', 
    label: 'Error Alert',
    bgColor: 'bg-red-50'
  },
};

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] || { 
    icon: '⚪', 
    color: 'text-gray-700', 
    label: eventType,
    bgColor: 'bg-gray-50'
  };
}

function groupEventsByDay(events: Event[]): GroupedEvents {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const grouped: GroupedEvents = {
    today: [],
    yesterday: [],
    older: [],
  };

  events.forEach(event => {
    const eventDate = new Date(event.created_at);
    
    if (eventDate >= todayStart) {
      grouped.today.push(event);
    } else if (eventDate >= yesterdayStart) {
      grouped.yesterday.push(event);
    } else {
      grouped.older.push(event);
    }
  });

  return grouped;
}

function formatEventMessage(event: Event): string {
  const metadata = event.metadata || {};
  
  switch (event.event_type) {
    case 'lead.created':
      return `New lead: ${metadata.name || 'Unknown'} from ${metadata.source || 'Unknown'}`;
    
    case 'lead.status_updated':
      return `Lead status: ${metadata.old_status || '?'} → ${metadata.new_status || '?'}`;
    
    case 'sms.sent':
      const msgType = metadata.message_type || 'notification';
      const recipient = metadata.recipient ? ` to ${metadata.recipient}` : '';
      return `SMS ${msgType}${recipient}`;
    
    case 'summary.sent':
      return `Daily summary (${metadata.total || 0} leads)`;
    
    case 'cleanup.run':
      const leads = metadata.leads_deleted || 0;
      const events = metadata.events_deleted || 0;
      return `Cleaned ${leads} leads, ${events} events`;
    
    case 'error.alert':
      const source = metadata.source || 'Unknown';
      const message = metadata.message || 'Unknown error';
      return `Error in ${source}: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`;
    
    default:
      return event.event_type;
  }
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events/recent?limit=50');
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      setEvents(data.events || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchEvents, 15000);

    return () => clearInterval(interval);
  }, []);

  const grouped = groupEventsByDay(events);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Activity Feed</h2>
        </div>
        <div className="text-center text-gray-500 py-8">Loading activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Activity Feed</h2>
        </div>
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    );
  }

  const renderEvent = (event: Event) => {
    const config = getEventConfig(event.event_type);
    const isExpanded = expandedEvent === event.id;
    const isError = event.event_type === 'error.alert';

    return (
      <div
        key={event.id}
        className={`
          p-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer
          hover:shadow-md ${config.bgColor} ${isError ? 'border-l-4 border-red-500' : ''}
          animate-fade-in
        `}
        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${config.color}`}>
                  {config.label}
                </p>
                <p className="text-sm text-gray-700 mt-1 break-words">
                  {formatEventMessage(event)}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {isExpanded && event.metadata && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-2">Metadata:</p>
                <pre className="text-xs text-gray-600 bg-white rounded p-2 overflow-x-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, sectionEvents: Event[]) => {
    if (sectionEvents.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {title}
        </h3>
        {sectionEvents.map(renderEvent)}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Activity Feed</h2>
        <div className="text-xs text-gray-500">
          Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No activity yet
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto space-y-1">
          {renderSection('Today', grouped.today)}
          {renderSection('Yesterday', grouped.yesterday)}
          {renderSection('Older', grouped.older)}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

