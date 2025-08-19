import React from 'react';
import { MdBuildCircle } from 'react-icons/md';

const AdminSystem = () => (
  <div className="w-full px-4 sm:px-6 md:px-8">
    <div className="max-w-3xl mx-auto">
      <div className="bg-grayDash rounded-xl p-8 flex flex-col items-center text-center">
        <MdBuildCircle className="text-pink2 text-6xl mb-4" />
        <h2 className="text-xl md:text-2xl font-radioCanada text-white mb-2">System Management</h2>
        <p className="text-white2 text-sm md:text-base max-w-xl">
          Coming soon — system monitoring and configuration tools will appear here.
        </p>

        <ul className="mt-4 text-white2 text-sm list-disc list-inside space-y-1">
          <li>Health metrics (CPU, memory, queues)</li>
          <li>Service status and alerts</li>
          <li>System configuration and logs</li>
        </ul>

        <div className="mt-4 text-gray-400 text-xs">We'll notify admins when features are live.</div>
      </div>
    </div>
  </div>
);

export default AdminSystem;

