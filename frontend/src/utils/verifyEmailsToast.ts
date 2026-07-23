export const VERIFY_TOAST_MIN_VISIBLE_MS = 300

export type VerifyFailure = { leadId: number; email: string; error: string }

/**
 * How long (ms) to keep the loading toast visible before showing the result.
 * Positive means "wait this long first", non-positive means "show now".
 */
export function getRemainingVerifyToastDelay(
  startedAt: number,
  now: number = Date.now(),
  minVisibleMs: number = VERIFY_TOAST_MIN_VISIBLE_MS
): number {
  return minVisibleMs - (now - startedAt)
}

function resolveEmail(
  leadId: number,
  leads: Array<{ id: number; email: string | null }> | undefined
) {
  return leads?.find((lead) => lead.id === leadId)?.email || 'Unknown email'
}

export function mapErrorsToFailures(
  errors: Array<{ leadId: number; error: string }>,
  leads: Array<{ id: number; email: string | null }> | undefined
): VerifyFailure[] {
  return errors.map((error) => ({
    leadId: error.leadId,
    email: resolveEmail(error.leadId, leads),
    error: error.error,
  }))
}

export function mapIdsToFailures(
  leadIds: number[],
  message: string,
  leads: Array<{ id: number; email: string | null }> | undefined
): VerifyFailure[] {
  return leadIds.map((leadId) => ({
    leadId,
    email: resolveEmail(leadId, leads),
    error: message,
  }))
}

export type VerifyResultSummary = {
  total: number
  variant: 'success' | 'error' | 'partial'
  text: string
}

export function buildVerifyResultSummary(
  verifiedCount: number,
  failuresCount: number
): VerifyResultSummary {
  const total = verifiedCount + failuresCount
  const verifiedText = `Verified ${verifiedCount} out of ${total} email${total === 1 ? '' : 's'}`

  if (failuresCount === 0) {
    return { total, variant: 'success', text: verifiedText }
  }

  if (verifiedCount === 0) {
    return {
      total,
      variant: 'error',
      text: `Failed to verify ${failuresCount} email${failuresCount === 1 ? '' : 's'}`,
    }
  }

  return { total, variant: 'partial', text: verifiedText }
}
