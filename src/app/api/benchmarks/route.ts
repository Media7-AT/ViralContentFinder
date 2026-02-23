import { NextRequest, NextResponse } from 'next/server'
import { getBenchmarks, getPlatformBenchmarks } from '@/lib/benchmarks'
import type { GetBenchmarksResponse } from '@/types/api'
import type { Platform } from '@/types/metrics'

export async function GET(
  req: NextRequest
): Promise<NextResponse<GetBenchmarksResponse | unknown>> {
  const platform = req.nextUrl.searchParams.get('platform') as Platform | null

  if (platform) {
    const benchmarks = await getPlatformBenchmarks(platform)
    return NextResponse.json({ [platform]: benchmarks })
  }

  const all = await getBenchmarks()
  return NextResponse.json(all)
}
