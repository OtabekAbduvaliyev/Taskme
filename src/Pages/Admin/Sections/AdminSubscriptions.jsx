import React from 'react';
import { MdSubscriptions } from 'react-icons/md';

const AdminSubscriptions = () => (
  <div className="w-full px-4 sm:px-6 md:px-8">
    <div className="max-w-3xl mx-auto">
      <div className="bg-grayDash rounded-xl p-8 flex flex-col items-center text-center">
        <MdSubscriptions className="text-pink2 text-6xl mb-4" />
        <h2 className="text-xl md:text-2xl font-radioCanada text-white mb-2">Subscription Management</h2>
        <p className="text-white2 text-sm md:text-base max-w-xl">
          Coming soon — subscription tools (plans, invoices, exports) will be available here.
        </p>

        {/* short, readable hint list */}
        <ul className="mt-4 text-white2 text-sm list-disc list-inside space-y-1">
          <li>Manage plans and pricing</li>
          <li>View and export invoices</li>
          <li>Monitor renewals and cancellations</li>
        </ul>

        <div className="mt-4 text-gray-400 text-xs">Features are in development — stay tuned.</div>
      </div>
    </div>
  </div>
);

export default AdminSubscriptions;
