export { auth as proxy } from '@/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/videos/:path*',
    '/api/ingest/:path*',
    '/api/benchmarks/:path*',
    '/api/metrics/:path*',
    '/api/settings/:path*',
    '/api/alerts/:path*',
    '/api/export/:path*',
  ],
}
