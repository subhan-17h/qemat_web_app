import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-16 text-center">
      <div>{icon}</div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
