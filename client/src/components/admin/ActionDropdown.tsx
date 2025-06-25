import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";

export interface ActionDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
  disabled?: boolean;
}

interface ActionDropdownProps {
  actions: ActionDropdownItem[];
  buttonLabel?: string;
  buttonDisabled?: boolean;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  actions,
  buttonDisabled = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = (action: ActionDropdownItem) => {
    setShowDropdown(false);
    if (!action.disabled) action.onClick();
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="secondary"
        size="default"
        className="flex items-center gap-2"
        disabled={buttonDisabled}
      >
        <MoreVertical size={16} />
      </Button>
      {showDropdown && (
        <>
          <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-white/20 rounded-lg shadow-lg z-50">
            <div className="py-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(action)}
                  className={`block w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 transition-colors whitespace-nowrap ${action.colorClass || ""}`}
                  style={typography.body1R}
                  disabled={action.disabled}
                >
                  {action.icon}
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        </>
      )}
    </div>
  );
};

export default ActionDropdown;