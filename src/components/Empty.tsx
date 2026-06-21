import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export function Empty({ icon: Icon, title = '暂无数据', description, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-300" />
        </div>
      )}
      <p className="text-base font-medium text-slate-600">{title}</p>
      {description && (
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      )}
    </div>
  );
}

export default Empty;
