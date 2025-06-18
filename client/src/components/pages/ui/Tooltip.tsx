import React, { createContext, useContext } from 'react';

const TooltipContext = createContext({});

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipContext.Provider value={{}}>
      {children}
    </TooltipContext.Provider>
  );
};

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export default Tooltip;