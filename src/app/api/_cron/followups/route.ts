import { NextRequest, NextResponse } from 'next/server';

// ========================================
// FOLLOW-UP CRON WRAPPER API ROUTE
// ========================================

/**
 * Follow-Up Cron Wrapper API Route
 * 
 * Provides a cron-friendly endpoint that wraps the follow-up trigger functionality.
 * Used by Vercel Cron or external cron services for automated daily execution.
 * 
 * Features:
 * - GET endpoint for cron scheduling
 * - Calls the main follow-up trigger API
 * - Proper error handling and logging
 * - Admin-only access (x-cron-secret required)
 */

/**
 * GET /api/_cron/followups
 * Cron wrapper endpoint for automated follow-up reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      console.log('[Cron:FollowUp] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron:FollowUp] Cron job triggered');

    // Call the main follow-up trigger API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/followups/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Cron:FollowUp] Follow-up trigger failed:', result);
      return NextResponse.json(
        {
          success: false,
          message: 'Follow-up trigger failed',
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: response.status }
      );
    }

    console.log('[Cron:FollowUp] Follow-up trigger completed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Follow-up cron job completed',
      result: result,
      timestamp: new Date().toISOString(),
      endpoint: '/api/_cron/followups'
    });

  } catch (error) {
    console.error('[Cron:FollowUp] Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/_cron/followups
 * Alternative POST endpoint for cron services that prefer POST
 */
export async function POST(request: NextRequest) {
  // Delegate to GET handler
  return GET(request);
}
