import React, { useState } from 'react';

/**
 * A toggle switch for managers to set an agent's "fixed" status.
 */
const FixedStatusToggle = ({ agentName, isFixed, isManager, onStatusChange }) => {
    const [currentStatus, setCurrentStatus] = useState(isFixed);
    const [isLoading, setIsLoading] = useState(false);

    if (!isManager) {
        return null; // Don't render for non-managers
    }

    const handleChange = async (event) => {
        const newStatus = event.target.checked;
        setIsLoading(true);
        setCurrentStatus(newStatus); // Optimistic UI update
        if (onStatusChange) onStatusChange(newStatus);

        try {
            const response = await fetch(`/api/agents/${agentName}/fixed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fixed: newStatus }),
            });

            if (!response.ok) {
                setCurrentStatus(!newStatus); // Revert on failure
                if (onStatusChange) onStatusChange(!newStatus);
            }
        } catch (error) {
            console.error('Error updating fixed status:', error);
            setCurrentStatus(!newStatus); // Revert on network error
            if (onStatusChange) onStatusChange(!newStatus);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between py-2">
            <span className="font-medium text-gray-700">Fixed Assignment</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={currentStatus} onChange={handleChange} disabled={isLoading} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
};

export default FixedStatusToggle;