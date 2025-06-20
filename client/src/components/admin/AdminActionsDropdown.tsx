import React, { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";

interface AdminActionsDropdownProps {
  onDeleteTenant?: () => void;
}

const AdminActionsDropdown: React.FC<AdminActionsDropdownProps> = ({ onDeleteTenant }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDeleteTenant = () => {
    setShowDropdown(false);
    if (onDeleteTenant) onDeleteTenant();
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="secondary"
        size="default"
        className="flex items-center gap-2"
      >
        <MoreVertical size={16} />
        More
      </Button>
      {showDropdown && (
        <>
          <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-white/20 rounded-lg shadow-lg z-50">
            <div className="py-2">
              <button
                onClick={handleDeleteTenant}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                style={typography.body1R}
              >
                <Trash2 size={16} />
                Delete Tenant
              </button>
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

export default AdminActionsDropdown; 