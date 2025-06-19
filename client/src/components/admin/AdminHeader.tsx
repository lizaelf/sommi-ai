import React from "react";
import { ArrowLeft, Plus, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";

interface AdminHeaderProps {
  currentTenant: { name: string; slug: string } | null;
  onAddTenant: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTenant,
  onAddTenant,
}) => {
  return (
    <AppHeader
      title={currentTenant?.name || "Admin Panel"}
      showBackButton={true}
      rightContent={
        <Button
          onClick={onAddTenant}
          variant="primary"
          size="default"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Tenant
        </Button>
      }
    />
  );
};