import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, code, summary } = body
    
    // Here you would integrate with Reviewer agent
    // For demo, we'll simulate a review result
    
    const mockReviewResult = {
      taskId,
      passed: false,
      issues: [
        {
          id: `issue-${Date.now()}`,
          severity: 'warning',
          location: 'src/lib/auth.ts:45',
          description: '建议添加Token过期时间的环境变量配置',
          suggestion: '将硬编码的过期时间改为从 process.env.TOKEN_EXPIRY 读取',
          fixed: false
        }
      ],
      summary: summary || '代码已提交，等待审查...',
      reviewedAt: new Date()
    }
    
    return NextResponse.json({ success: true, review: mockReviewResult })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit for review' },
      { status: 500 }
    )
  }
}