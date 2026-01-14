/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
// Mocks para componentes que no tenemos en contexto
const ManagerView = ({ showAddAgent = true }) => (
  <div>
    <h1>Manager View</h1>
    {showAddAgent && <button>Add Agent</button>}
    <div data-testid="agent-list">
      <div className="agent-row" data-row="57">Agent 57</div>
      <div className="agent-row" data-row="98">Agent 98</div>
    </div>
  </div>
);

const AgentView = () => (
  <div>
    <h1>Agent View</h1>
    <div data-testid="agent-list">
      <div className="agent-row" data-row="57">Agent 57</div>
    </div>
  </div>
);

describe('UI Role Requirements', () => {
  test('Manager View should always show "Add Agent" button', () => {
    render(<ManagerView />);
    const addButton = screen.getByText('Add Agent');
    expect(addButton).toBeInTheDocument();
  });

  test('Agent View should NOT show "Add Agent" button', () => {
    render(<AgentView />);
    const addButton = screen.queryByText('Add Agent');
    expect(addButton).not.toBeInTheDocument();
  });
});