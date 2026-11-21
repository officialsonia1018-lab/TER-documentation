// Demo user roles for the TER Documentation Portal (frontend only).
// Each role controls what a user can see and do in the current React session.

export const ROLES = [
  {
    id: 'employee',
    label: 'Employee',
    shortLabel: 'Employee',
    description: 'Creates and submits travel and expense claims, tracks status and manages own account.',
    color: 'indigo',
  },
  {
    id: 'supervisor-l1',
    label: 'Supervisor L1',
    shortLabel: 'L1',
    description: 'First level approval: approves, rejects or forwards submitted claims.',
    color: 'blue',
  },
  {
    id: 'supervisor-l2',
    label: 'Supervisor L2',
    shortLabel: 'L2',
    description: 'Second level and final approval for claims that require L2 review.',
    color: 'purple',
  },
  {
    id: 'admin',
    label: 'Admin / TER / Accounts',
    shortLabel: 'Admin',
    description: 'Manages master data, processes claims, generates UNIDs and runs reports.',
    color: 'emerald',
  },
  {
    id: 'processor',
    label: 'Processor',
    shortLabel: 'Processor',
    description: 'Handles DG Advance disbursement, payment processing and settlement.',
    color: 'amber',
  },
];

export function getRoleById(id) {
  return ROLES.find((role) => role.id === id) || null;
}

export function roleLabel(id) {
  const role = getRoleById(id);
  return role ? role.label : id;
}
