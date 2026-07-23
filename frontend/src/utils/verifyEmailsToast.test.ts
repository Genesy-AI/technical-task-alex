import { describe, it, expect } from 'vitest'
import {
  VERIFY_TOAST_MIN_VISIBLE_MS,
  getRemainingVerifyToastDelay,
  mapErrorsToFailures,
  mapIdsToFailures,
  buildVerifyResultSummary,
} from './verifyEmailsToast'

describe('getRemainingVerifyToastDelay', () => {
  it('returns the full window when no time has elapsed', () => {
    expect(getRemainingVerifyToastDelay(1000, 1000)).toBe(VERIFY_TOAST_MIN_VISIBLE_MS)
  })

  it('returns a positive remainder when the result comes back before the minimum window', () => {
    expect(getRemainingVerifyToastDelay(1000, 1100)).toBe(VERIFY_TOAST_MIN_VISIBLE_MS - 100)
  })

  it('returns zero when the result lands exactly on the minimum window', () => {
    expect(getRemainingVerifyToastDelay(1000, 1000 + VERIFY_TOAST_MIN_VISIBLE_MS)).toBe(0)
  })

  it('returns a non-positive value once the minimum window has passed', () => {
    expect(getRemainingVerifyToastDelay(1000, 5000)).toBeLessThanOrEqual(0)
  })
})

describe('mapErrorsToFailures', () => {
  const leads = [
    { id: 1, email: 'a@example.com' },
    { id: 2, email: 'b@example.com' },
  ]

  it('maps backend errors to failures, resolving each email from the lead list', () => {
    const failures = mapErrorsToFailures(
      [
        { leadId: 1, error: 'Invalid domain' },
        { leadId: 2, error: 'Timed out' },
      ],
      leads
    )

    expect(failures).toEqual([
      { leadId: 1, email: 'a@example.com', error: 'Invalid domain' },
      { leadId: 2, email: 'b@example.com', error: 'Timed out' },
    ])
  })

  it('falls back to "Unknown email" when the lead is missing or has no email', () => {
    const failures = mapErrorsToFailures(
      [
        { leadId: 999, error: 'boom' },
        { leadId: 3, error: 'boom' },
      ],
      [...leads, { id: 3, email: null as unknown as string }]
    )

    expect(failures).toEqual([
      { leadId: 999, email: 'Unknown email', error: 'boom' },
      { leadId: 3, email: 'Unknown email', error: 'boom' },
    ])
  })

  it('falls back to "Unknown email" when no lead list is available', () => {
    const failures = mapErrorsToFailures([{ leadId: 1, error: 'boom' }], undefined)

    expect(failures).toEqual([{ leadId: 1, email: 'Unknown email', error: 'boom' }])
  })

  it('returns an empty array when there are no errors', () => {
    expect(mapErrorsToFailures([], leads)).toEqual([])
  })
})

describe('mapIdsToFailures', () => {
  const leads = [{ id: 1, email: 'a@example.com' }]

  it('applies the same message to every lead id', () => {
    const failures = mapIdsToFailures([1, 2], 'Network error', leads)

    expect(failures).toEqual([
      { leadId: 1, email: 'a@example.com', error: 'Network error' },
      { leadId: 2, email: 'Unknown email', error: 'Network error' },
    ])
  })

  it('returns an empty array for an empty id list', () => {
    expect(mapIdsToFailures([], 'Network error', leads)).toEqual([])
  })
})

describe('buildVerifyResultSummary', () => {
  it('reports success with singular wording for a single verified email', () => {
    expect(buildVerifyResultSummary(1, 0)).toEqual({
      total: 1,
      variant: 'success',
      text: 'Verified 1 out of 1 email',
    })
  })

  it('reports success with plural wording for multiple verified emails', () => {
    expect(buildVerifyResultSummary(3, 0)).toEqual({
      total: 3,
      variant: 'success',
      text: 'Verified 3 out of 3 emails',
    })
  })

  it('reports a full failure when nothing was verified', () => {
    expect(buildVerifyResultSummary(0, 2)).toEqual({
      total: 2,
      variant: 'error',
      text: 'Failed to verify 2 emails',
    })
  })

  it('uses singular wording for a single full failure', () => {
    expect(buildVerifyResultSummary(0, 1)).toEqual({
      total: 1,
      variant: 'error',
      text: 'Failed to verify 1 email',
    })
  })

  it('reports a partial result when some verified and some failed', () => {
    expect(buildVerifyResultSummary(2, 1)).toEqual({
      total: 3,
      variant: 'partial',
      text: 'Verified 2 out of 3 emails',
    })
  })

  it('treats zero verified and zero failures as a (vacuous) success', () => {
    expect(buildVerifyResultSummary(0, 0)).toEqual({
      total: 0,
      variant: 'success',
      text: 'Verified 0 out of 0 emails',
    })
  })
})
