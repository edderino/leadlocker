import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { log } from '@/libs/log';

// ========================================
// AI SUGGESTIONS API ROUTE
// ========================================

/**
 * AI Suggestions API Route
 * 
 * Provides intelligent recommendations based on recent leads and events analysis.
 * 
 * GET: Fetch and analyze recent data, return top 3 actionable insights
 * POST: Trigger push notification for suggestions (admin-only)
 */

// ========================================
// DATA ANALYSIS FUNCTIONS
// ========================================

interface LeadData {
  id: string;
  created_at: string;
  status: string;
  phone: string;
  name?: string;
}

interface EventData {
  id: string;
  created_at: string;
  event_type: string;
  metadata?: any;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

/**
 * Analyze recent leads and events to generate actionable insights
 */
async function analyzeData(orgId: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  try {
    // Fetch leads from last 7 days
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, created_at, status, phone, name')
      .eq('org_id', orgId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('[AI:Suggestions] Error fetching leads:', leadsError);
      return getFallbackSuggestions();
    }

    // Fetch events from last 7 days
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, created_at, event_type, metadata')
      .eq('org_id', orgId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('[AI:Suggestions] Error fetching events:', eventsError);
      return getFallbackSuggestions();
    }

    const leadsData = leads || [];
    const eventsData = events || [];

    console.log(`[AI:Suggestions] Analyzing ${leadsData.length} leads and ${eventsData.length} events for org: ${orgId}`);

    // Generate suggestions based on data analysis
    suggestions.push(...analyzeLeadFollowUp(leadsData));
    suggestions.push(...analyzeApprovalRates(leadsData, eventsData));
    suggestions.push(...analyzeResponseTimes(eventsData));
    suggestions.push(...analyzeLeadVolume(leadsData));

    // Return top 3 suggestions
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);

  } catch (error) {
    console.error('[AI:Suggestions] Analysis error:', error);
    return getFallbackSuggestions();
  }
}

/**
 * Analyze lead follow-up needs
 */
function analyzeLeadFollowUp(leads: LeadData[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Find unapproved leads older than 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const unapprovedLeads = leads.filter(lead => 
    lead.status === 'pending' && 
    new Date(lead.created_at) < threeDaysAgo
  );

  if (unapprovedLeads.length > 0) {
    suggestions.push({
      id: 'follow-up-unapproved',
      title: 'Follow Up Required',
      description: `${unapprovedLeads.length} unapproved lead${unapprovedLeads.length > 1 ? 's' : ''} older than 3 days`,
      action: `Review and approve ${unapprovedLeads.length} pending lead${unapprovedLeads.length > 1 ? 's' : ''}`,
      priority: unapprovedLeads.length >= 3 ? 'high' : 'medium',
      icon: '📞'
    });
  }

  return suggestions;
}

/**
 * Analyze approval rates
 */
function analyzeApprovalRates(leads: LeadData[], events: EventData[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  if (leads.length < 5) return suggestions; // Need minimum data

  const approvedLeads = leads.filter(lead => lead.status === 'approved').length;
  const totalLeads = leads.length;
  const approvalRate = (approvedLeads / totalLeads) * 100;

  // Compare with previous week if we have enough data
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const previousWeekLeads = leads.filter(lead => {
    const createdAt = new Date(lead.created_at);
    return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
  });

  if (previousWeekLeads.length >= 3) {
    const prevApproved = previousWeekLeads.filter(lead => lead.status === 'approved').length;
    const prevApprovalRate = (prevApproved / previousWeekLeads.length) * 100;
    const rateChange = approvalRate - prevApprovalRate;

    if (rateChange < -10) {
      suggestions.push({
        id: 'approval-rate-drop',
        title: 'Approval Rate Alert',
        description: `Approval rate dropped ${Math.abs(rateChange).toFixed(1)}% this week`,
        action: 'Review lead quality and approval process',
        priority: 'high',
        icon: '📉'
      });
    } else if (rateChange > 10) {
      suggestions.push({
        id: 'approval-rate-improvement',
        title: 'Great Progress!',
        description: `Approval rate improved ${rateChange.toFixed(1)}% this week`,
        action: 'Keep up the excellent work!',
        priority: 'low',
        icon: '📈'
      });
    }
  }

  return suggestions;
}

/**
 * Analyze response times
 */
function analyzeResponseTimes(events: EventData[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Analyze lead.created events vs lead.approved events
  const leadCreatedEvents = events.filter(e => e.event_type === 'lead.created');
  const leadApprovedEvents = events.filter(e => e.event_type === 'lead.approved');

  if (leadCreatedEvents.length >= 3 && leadApprovedEvents.length >= 2) {
    // Calculate average response time
    const responseTimes: number[] = [];
    
    leadApprovedEvents.forEach(approvedEvent => {
      const createdEvent = leadCreatedEvents.find(createdEvent => 
        createdEvent.metadata?.lead_id === approvedEvent.metadata?.lead_id
      );
      
      if (createdEvent) {
        const responseTime = new Date(approvedEvent.created_at).getTime() - 
                           new Date(createdEvent.created_at).getTime();
        responseTimes.push(responseTime);
      }
    });

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const avgHours = avgResponseTime / (1000 * 60 * 60);

      if (avgHours < 24) {
        suggestions.push({
          id: 'fast-response',
          title: 'Excellent Response Time',
          description: `Average approval time: ${avgHours.toFixed(1)} hours`,
          action: 'Maintain this quick response pace!',
          priority: 'low',
          icon: '⚡'
        });
      } else if (avgHours > 72) {
        suggestions.push({
          id: 'slow-response',
          title: 'Response Time Alert',
          description: `Average approval time: ${avgHours.toFixed(1)} hours`,
          action: 'Consider faster lead processing',
          priority: 'high',
          icon: '⏰'
        });
      }
    }
  }

  return suggestions;
}

/**
 * Analyze lead volume trends
 */
function analyzeLeadVolume(leads: LeadData[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  if (leads.length < 7) return suggestions; // Need at least a week of data

  // Group leads by day
  const leadsByDay = leads.reduce((acc, lead) => {
    const day = new Date(lead.created_at).toDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dailyCounts = Object.values(leadsByDay);
  const avgDailyLeads = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;

  if (avgDailyLeads > 5) {
    suggestions.push({
      id: 'high-volume',
      title: 'High Lead Volume',
      description: `Averaging ${avgDailyLeads.toFixed(1)} leads per day`,
      action: 'Consider scaling your approval process',
      priority: 'medium',
      icon: '📊'
    });
  } else if (avgDailyLeads < 1) {
    suggestions.push({
      id: 'low-volume',
      title: 'Low Lead Volume',
      description: `Only ${avgDailyLeads.toFixed(1)} leads per day`,
      action: 'Review lead generation strategies',
      priority: 'medium',
      icon: '📉'
    });
  }

  return suggestions;
}

/**
 * Fallback suggestions when data is insufficient
 */
function getFallbackSuggestions(): Suggestion[] {
  return [
    {
      id: 'welcome-suggestion',
      title: 'Welcome to AI Insights',
      description: 'Start generating leads to see personalized recommendations',
      action: 'Create your first lead to unlock AI suggestions',
      priority: 'low',
      icon: '🤖'
    },
    {
      id: 'data-collection',
      title: 'Building Your Profile',
      description: 'We need more data to provide accurate insights',
      action: 'Continue using LeadLocker to improve recommendations',
      priority: 'low',
      icon: '📈'
    },
    {
      id: 'feature-preview',
      title: 'AI Suggestions Preview',
      description: 'Once you have 5+ leads, we\'ll analyze patterns and suggest optimizations',
      action: 'Keep adding leads to see personalized insights',
      priority: 'low',
      icon: '💡'
    }
  ];
}

// ========================================
// API ROUTE HANDLERS
// ========================================

/**
 * GET /api/ai/suggestions
 * Fetch AI-generated suggestions for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[AI:Suggestions] Fetching suggestions for org: ${orgId}`);

    const suggestions = await analyzeData(orgId);

    // Log the analysis event
    await log(`[AI:Suggestions] Generated ${suggestions.length} suggestions for org: ${orgId}`);

    return NextResponse.json({
      success: true,
      suggestions,
      generated_at: new Date().toISOString(),
      org_id: orgId
    });

  } catch (error) {
    console.error('[AI:Suggestions] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/suggestions
 * Trigger push notification for AI suggestions (admin-only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    console.log(`[AI:Suggestions] Triggering push notification for org: ${orgId}`);

    // Generate suggestions
    const suggestions = await analyzeData(orgId);
    
    if (suggestions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No suggestions available to send'
      });
    }

    // Create notification content
    const topSuggestion = suggestions[0];
    const notificationTitle = '🤖 AI Insight';
    const notificationMessage = `${topSuggestion.title}: ${topSuggestion.description}`;

    // Trigger push notification
    const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'test-secret-12345'
      },
      body: JSON.stringify({
        orgId,
        eventType: 'ai.suggestion',
        title: notificationTitle,
        message: notificationMessage,
        url: `/client/${orgId}`
      })
    });

    const triggerResult = await triggerResponse.json();

    // Log the notification event
    await log(`[AI:Suggestions] Notification sent for org: ${orgId}, suggestion: ${topSuggestion.id}`);

    return NextResponse.json({
      success: true,
      message: 'AI suggestion notification sent',
      suggestion: topSuggestion,
      notification_result: triggerResult
    });

  } catch (error) {
    console.error('[AI:Suggestions] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send AI suggestion notification' },
      { status: 500 }
    );
  }
}
