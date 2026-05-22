interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  // Order statuses
  Processing: { label: 'Processing', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  Confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  'In Progress': { label: 'In Progress', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  in_progress: { label: 'In Progress', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  Shipped: { label: 'Shipped', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipped: { label: 'Shipped', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Completed: { label: 'Completed', classes: 'bg-green-50 text-green-700 border-green-200' },
  completed: { label: 'Completed', classes: 'bg-green-50 text-green-700 border-green-200' },
  delivered: { label: 'Delivered', classes: 'bg-green-50 text-green-700 border-green-200' },
  Cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border-red-200' },
  // Custom order statuses
  Pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  Reviewing: { label: 'Reviewing', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
  Rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-secondary text-foreground/70 border-border'
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
