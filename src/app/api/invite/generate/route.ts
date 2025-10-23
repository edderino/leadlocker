import { NextRequest, NextResponse } from 'next/server';
import { createInviteToken } from '@/libs/signing';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId') || 'test-client';
    const ttlHours = parseInt(request.nextUrl.searchParams.get('hours') || '24');
    
    const token = createInviteToken(orgId, ttlHours);
    
    return NextResponse.json({
      success: true,
      orgId,
      ttlHours,
      token,
      inviteUrl: `https://leadlocker.vercel.app/client/access?token=${token}`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
