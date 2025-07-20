import React from 'react';
import { ModuleAccessProvider } from '@/contexts/ModuleAccessContext';
import ModuleAccessManager from '@/components/ModuleAccessManager';

const ModuleAccessPage: React.FC = () => {
  return (
    <ModuleAccessProvider>
      <div className="container mx-auto p-6">
        <ModuleAccessManager />
      </div>
    </ModuleAccessProvider>);

};

export default ModuleAccessPage;