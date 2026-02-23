import axios from 'axios'

const BASE_URL = 'https://api.apify.com/v2'

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN is not set')
  return token
}

export interface ApifyRunResult {
  id: string
  status: string
  defaultDatasetId: string
}

/** Run an Apify actor and wait for completion (polls until done) */
export async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 120_000
): Promise<unknown[]> {
  const token = getToken()

  // Start the actor run
  const runRes = await axios.post<{ data: ApifyRunResult }>(
    `${BASE_URL}/acts/${actorId}/runs`,
    input,
    { params: { token }, timeout: 30_000 }
  )

  const runId = runRes.data.data.id

  // Poll until finished
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(5000)

    const statusRes = await axios.get<{ data: ApifyRunResult }>(`${BASE_URL}/actor-runs/${runId}`, {
      params: { token },
      timeout: 10_000,
    })

    const status = statusRes.data.data.status
    if (status === 'SUCCEEDED') {
      return fetchDataset(statusRes.data.data.defaultDatasetId, token)
    }
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify actor ${actorId} failed with status: ${status}`)
    }
  }

  throw new Error(`Apify actor ${actorId} timed out after ${timeoutMs}ms`)
}

async function fetchDataset(datasetId: string, token: string): Promise<unknown[]> {
  const res = await axios.get<{ items: unknown[] }>(`${BASE_URL}/datasets/${datasetId}/items`, {
    params: { token, format: 'json', clean: 'true' },
    timeout: 30_000,
  })
  return res.data.items ?? []
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
