import React from "react";
import { SegmentedPicker } from "@/components/misc/SegmentedPicker";

interface TabNavigationProps {
  activeTab: "profile" | "cms" | "ai-model";
  onTabChange: (tab: "profile" | "cms" | "ai-model") => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #333" }}>
      <SegmentedPicker
        options={[
          { label: "Profile", value: "profile" },
          { label: "CMS", value: "cms" },
          { label: "AI Model", value: "ai-model" },
        ]}
        value={activeTab}
        onChange={(value) => onTabChange(value as "profile" | "cms" | "ai-model")}
      />
    </div>
  );
};