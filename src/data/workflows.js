// Business workflows used by the documentation portal dashboard and detail pages.
// Frontend demo data only - no backend involved.

export const CLAIM_LIFECYCLE = [
  { label: 'Employee', detail: 'Create or maintain expenses and submit the claim' },
  { label: 'Supervisor L1', detail: 'Approve, reject or forward the claim' },
  { label: 'Supervisor L2', detail: 'Final approval when required' },
  { label: 'UNID Generation', detail: 'Unique reference number after final approval' },
  { label: 'TER / Accounts', detail: 'Processing and verification' },
  { label: 'Payment', detail: 'Disbursement to the employee' },
  { label: 'Paid', detail: 'Claim completed and closed' },
];

export const APPROVAL_ROUTING = [
  { label: 'Submit claim', detail: 'Every claim first goes to Supervisor L1' },
  { label: 'L1 review', detail: 'Approve, reject, or forward to L2' },
  { label: 'L2 review', detail: 'Only when required: special categories or supervisor claims' },
  { label: 'Final approval', detail: 'Claim is fully approved' },
  { label: 'UNID generated', detail: 'Unique reference number is created for the claim' },
];

export const DG_ADVANCE_FLOW = [
  { label: 'Request', detail: 'Employee requests a DG advance' },
  { label: 'Review', detail: 'Supervisor reviews the request' },
  { label: 'Release', detail: 'Advance is processed and released' },
  { label: 'Use', detail: 'Employee uses the advance for expenses' },
  { label: 'Settlement', detail: 'Employee submits settlement information' },
  { label: 'Disbursement', detail: 'Processor handles UTR / payment and settlement' },
];

export const TRAVEL_PLAN_FLOW = [
  { label: 'Plan travel', detail: 'Employee creates a day-by-day travel plan' },
  { label: 'Submit', detail: 'Plan is submitted for supervisor approval' },
  { label: 'Supervisor review', detail: 'Approve, reject, or return for modification' },
  { label: 'Approved plan', detail: 'Employee travels as per the approved plan' },
];

export const ADMIN_SECTIONS = [
  'Dashboard',
  'TER processing',
  'Payments',
  'Expense categories',
  'Limit masters',
  'Approval settings',
  'Enforcement settings',
  'SMS settings',
  'Reports',
  'Review MIS',
  'DG Advance',
  'User access',
  'Company settings',
];

export const COMPANY_RULES = [
  {
    company: 'D2F',
    period: '1st to last day of the calendar month',
    example: '1 June to 30 June',
  },
  {
    company: 'INDOFIL',
    period: '21st to the 20th of the next month',
    example: '21 June to 20 July',
  },
];
