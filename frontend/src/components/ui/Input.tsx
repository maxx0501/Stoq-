import type { LucideIcon } from 'lucide-react';

interface InputProps {
  label: string;
  type: string;
  placeholder: string;
  icon: LucideIcon;
}

export const Input = ({ label, type, placeholder, icon: Icon }: InputProps) => (
  <div className="mb-4 text-left">
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon size={18} />
      </div>
      <input 
        type={type} 
        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-800 dark:text-white dark:placeholder-slate-400"
        placeholder={placeholder}
      />
    </div>
  </div>
);
