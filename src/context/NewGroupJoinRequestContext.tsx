'use client';
import React, { createContext, useContext } from 'react';

const NewGroupJoinRequestContext = createContext({ hasNew: false, setHasNew: () => {} });
export const useNewGroupJoinRequest = () => useContext(NewGroupJoinRequestContext);
export const NewGroupJoinRequestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <NewGroupJoinRequestContext.Provider value={{ hasNew: false, setHasNew: () => {} }}>
    {children}
  </NewGroupJoinRequestContext.Provider>
); 