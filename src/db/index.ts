import { Pool, type PoolClient } from 'pg'

// Lazily-created shared connection pool. Reads DATABASE_URL (Aurora endpoint, or a
// local Postgres in development). In Lambda this should point at RDS Proxy.
let pool: Pool | undefined

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    // An idle pooled client can error out-of-band (e.g. Aurora/RDS Proxy closing
    // the connection). Without a listener, node-postgres re-emits it as an
    // unhandled 'error' event and crashes the whole process.
    pool.on('error', (error) => {
      console.error('Unexpected error on idle Postgres client', error)
    })
  }
  return pool
}

/**
 * Run work inside a transaction with the tenant context set, so Row-Level Security
 * policies (keyed on `app.tenant_id`) scope every query to the given tenant.
 *
 * The GUC is set with `is_local = true`, so it is reset automatically when the
 * transaction commits/rolls back — safe to use with a pooled connection.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId])
    const result = await fn(client)
    await client.query('COMMIT')
    client.release()
    return result
  } catch (error) {
    // Roll back, but never let a rollback failure mask the original error. If the
    // rollback itself fails the connection is likely broken, so destroy the client
    // (release(true)) instead of returning a poisoned one to the pool.
    try {
      await client.query('ROLLBACK')
      client.release()
    } catch {
      client.release(true)
    }
    throw error
  }
}
