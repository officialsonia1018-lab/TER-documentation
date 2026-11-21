import Badge from './Badge.jsx';
import { getStatusByCode } from '../../data/statuses.js';

// Badge that renders a TER claim status by its numeric code.

export default function StatusBadge({ code, className = '' }) {
  const status = getStatusByCode(code);
  if (!status) {
    return null;
  }
  return (
    <Badge color={status.color} className={className}>
      {status.shortLabel || status.label}
    </Badge>
  );
}
