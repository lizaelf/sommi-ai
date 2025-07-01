import React from "react";
import typography from "@/styles/typography";

interface AdminTitleProps {
  title: string;
  count?: number;
  showCount?: boolean;
}

export const AdminTitle: React.FC<AdminTitleProps> = ({
  title,
  count = 0,
  showCount = true
}) => {
  return (
    <div style={{ padding: "0 20px" }}>
      <h3 style={{ ...typography.h2, marginBottom: "16px" }}>
        {title} {showCount && `(${count})`}
      </h3>
    </div>
  );
};