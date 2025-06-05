interface SegmentedPickerOption {
  value: string;
  label: string;
}

interface SegmentedPickerProps {
  options: SegmentedPickerOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedPicker({ options, value, onChange, className = "" }: SegmentedPickerProps) {
  return (
    <div className={`flex w-full bg-white/10 backdrop-blur-sm rounded-xl p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={value === option.value ? { 
            backgroundColor: '#ffffff !important', 
            color: '#000000 !important',
            border: 'none !important',
            outline: 'none !important',
            backgroundImage: 'none !important'
          } : {
            border: 'none !important',
            outline: 'none !important',
            backgroundColor: 'transparent !important'
          }}
          className={`flex-1 relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out border-none text-center ${
            value === option.value
              ? "shadow-lg segmented-picker-active"
              : "text-white/80 hover:text-white hover:bg-white/5"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}