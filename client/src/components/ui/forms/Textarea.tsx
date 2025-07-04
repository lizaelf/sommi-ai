import React from 'react';

interface CustomTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

const CustomTextarea: React.FC<CustomTextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  label,
}) => (
  <div>
    {label && (
      <label className="block mb-2">
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      className={`w-full p-3 bg-white/5 border border-white/20 rounded-lg ${className}`}
      placeholder={placeholder}
    />
  </div>
);

export default CustomTextarea; 