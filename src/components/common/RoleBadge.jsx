import Badge from './Badge.jsx';
import { getRoleById } from '../../data/roles.js';

// Badge that renders a demo role with its configured color.

export default function RoleBadge({ roleKey, className = '' }) {
  const role = getRoleById(roleKey);
  if (!role) {
    return null;
  }
  return (
    <Badge color={role.color} className={className}>
      {role.label}
    </Badge>
  );
}
