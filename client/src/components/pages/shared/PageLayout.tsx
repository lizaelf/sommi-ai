import React from "react";
import AppHeader, { HeaderSpacer } from "@/components/pages/shared/AppHeader";

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  showDefaultHeader?: boolean;
  className?: string;
  maxWidth?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  showDefaultHeader = true,
  className = "",
  maxWidth = "1200px",
}) => {
  return (
    <div 
      className={`min-h-screen bg-black text-white mx-auto ${className}`} 
      style={{ maxWidth }}
    >
      {header || (showDefaultHeader && (
        <>
          <AppHeader />
          <HeaderSpacer />
        </>
      ))}
      {children}
    </div>
  );
};

export default PageLayout;