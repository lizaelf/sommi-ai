import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  label,
}) => (
  <div className="w-full">
    {label && (
      <label className="block mb-2">
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      className={cn(
        "w-full p-3 h-24 bg-transparent border border-white/20 text-white font-inter text-base outline-none box-border rounded-xl transition-all duration-200 placeholder:text-[#999999]",
      )}
      style={{ borderRadius: 16 }}
      placeholder={placeholder}
    />
  </div>
);

export default Textarea; 