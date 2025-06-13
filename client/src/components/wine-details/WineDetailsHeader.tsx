import React from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { IconButton } from "@/components/ui/IconButton";

interface WineDetailsHeaderProps {
  showActions: boolean;
  onToggleActions: () => void;
}

export const WineDetailsHeader: React.FC<WineDetailsHeaderProps> = ({
  showActions,
  onToggleActions,
}) => {
  return (
    <AppHeader
      rightContent={
        <IconButton onClick={onToggleActions}>
          <MoreHorizontal size={20} />
        </IconButton>
      }
    />
  );
};