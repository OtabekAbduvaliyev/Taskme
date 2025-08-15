import React from 'react';
import { MdBuildCircle } from 'react-icons/md';

const AdminSystem = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <MdBuildCircle className="text-pink2 text-8xl mb-4" />
    <h2 className="text-2xl font-radioCanada text-white mb-4">System Management</h2>
    <div className="text-white2 text-lg">
      System monitoring and configuration features coming soon.
    </div>
    <div className="text-gray-400 mt-2 text-white">
      Stay tuned for updates!
    </div>
  </div>
);

export default AdminSystem;
