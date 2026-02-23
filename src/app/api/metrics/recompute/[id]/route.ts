import { NextRequest, NextResponse } from 'next/server'
import { enqueueComputeVS } from '@/lib/queue'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const jobId = await enqueueComputeVS({ video_id: id })
  return NextResponse.json({ job_id: jobId, status: 'queued' })
}
