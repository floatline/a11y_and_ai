import { useContext } from 'react';
import { DemoContext, type DemoContextType } from '../demo/DemoContext';

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};
