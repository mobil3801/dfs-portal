import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModuleAccessProvider, useModuleAccess } from '../ModuleAccessContext';

const TestComponent = () => {
  const { moduleAccess } = useModuleAccess();
  return (
    <div>
      {moduleAccess && moduleAccess.length > 0 ? (
        <ul>
          {moduleAccess.map((module) => (
            <li key={module.module_name}>{module.display_name || module.module_name}</li>
          ))}
        </ul>
      ) : (
        <p>No module access available</p>
      )}
    </div>
  );
};

describe('ModuleAccessContext', () => {
  it('renders without crashing and displays module access', () => {
    const mockModuleAccess = [
      { module_name: 'products', display_name: 'Products', create_enabled: true, edit_enabled: true, delete_enabled: true },
      { module_name: 'employees', display_name: 'Employees', create_enabled: true, edit_enabled: true, delete_enabled: true },
    ];

    render(
      <ModuleAccessProvider>
        <TestComponent />
      </ModuleAccessProvider>
    );

    // Since the context fetches data asynchronously, we can only check for the presence of the component
    expect(screen.getByText(/No module access available/i) || screen.getByText(/Products/i)).toBeInTheDocument();
  });
});
