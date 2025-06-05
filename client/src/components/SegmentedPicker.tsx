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
    <div className={`inline-flex bg-white/10 backdrop-blur-sm rounded-xl p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
            value === option.value
              ? "!bg-white !text-black shadow-lg"
              : "text-white/80 hover:text-white hover:bg-white/5"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}