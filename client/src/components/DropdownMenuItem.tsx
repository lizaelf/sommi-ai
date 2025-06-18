import { ReactNode } from "react";
import Button from "./ui/Button";
import { cn } from "@/lib/utils";

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  icon, 
  variant = "default",
  disabled = false 
}: DropdownMenuItemProps) {
  const buttonVariant = variant === "danger" ? "error" : "tertiary";
  
  return (
    <Button
      variant={buttonVariant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-start gap-3 px-5 py-4 rounded-none h-auto text-left",
        "hover:bg-white/10 text-sm font-normal",
        variant === "danger" && "text-red-400 hover:text-red-300 hover:bg-red-500/10"
      )}
    >
      {icon && (
        <span className="flex items-center">
          {icon}
        </span>
      )}
      {children}
    </Button>
  );
}