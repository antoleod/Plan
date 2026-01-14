import React from 'react';

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const FixedIcon = () => (
    <span 
        className="inline-flex items-center bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full"
        title="Fixed Assignment: This agent should not be moved."
    >
        <LockIcon />
        <span className="ml-1">Fixed</span>
    </span>
);

export default FixedIcon;