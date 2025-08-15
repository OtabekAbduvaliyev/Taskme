import React from 'react';
import { MdSubscriptions } from 'react-icons/md';

const AdminSubscriptions = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <MdSubscriptions className="text-pink2 text-8xl mb-4" />
    <h2 className="text-2xl font-radioCanada text-white mb-4">Subscription Management</h2>
    <div className="text-white2 text-lg">
      Subscription management features are currently in development.
    </div>
    <div className="text-gray-400 mt-2 text-white">
      We're working hard to bring you powerful subscription management tools!
    </div>
  </div>
);

export default AdminSubscriptions;
