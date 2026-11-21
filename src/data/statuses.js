// Claim statuses used across the TER application (frontend demo data).
// Status codes match the TER business rules documented in the portal.

export const CLAIM_STATUSES = [
  {
    code: 1,
    label: 'Active / Draft / Returned',
    shortLabel: 'Draft / Returned',
    description: 'The claim is being prepared by the employee, or was returned by a supervisor for edits.',
    color: 'slate',
  },
  {
    code: 5,
    label: 'Pending L1 Approval',
    shortLabel: 'Pending L1',
    description: 'The claim was submitted and is waiting for Supervisor L1 action.',
    color: 'amber',
  },
  {
    code: 6,
    label: 'Pending L2 Approval',
    shortLabel: 'Pending L2',
    description: 'Supervisor L1 forwarded the claim and it is waiting for final approval by Supervisor L2.',
    color: 'purple',
  },
  {
    code: 2,
    label: 'Processing',
    shortLabel: 'Processing',
    description: 'The claim is fully approved and is being processed by TER / Accounts.',
    color: 'indigo',
  },
  {
    code: 14,
    label: 'Received / UNID Handover',
    shortLabel: 'Received',
    description: 'The claim has been received by TER / Accounts and a UNID reference has been generated.',
    color: 'blue',
  },
  {
    code: 4,
    label: 'Paid',
    shortLabel: 'Paid',
    description: 'Payment has been released to the employee and the claim is complete.',
    color: 'emerald',
  },
];

export function getStatusByCode(code) {
  return CLAIM_STATUSES.find((status) => status.code === Number(code)) || null;
}

export const STATUS_FLOW = [1, 5, 6, 2, 14, 4];
