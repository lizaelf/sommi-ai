import React from "react";

interface Tab {
  key: string;
  label: string;
}

interface TenantTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const TenantTabs: React.FC<TenantTabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex mb-6">
    {tabs.map(tab => (
      <button
        key={tab.key}
        className={`px-4 py-2 rounded-full mx-1 ${activeTab === tab.key ? 'bg-white text-black' : 'bg-black text-white border border-white/20'}`}
        onClick={() => onTabChange(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default TenantTabs; 