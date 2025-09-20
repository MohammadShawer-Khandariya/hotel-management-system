"use client";

import { Guest } from "@/types";

interface GuestListProps {
  guests: Guest[];
  detailed?: boolean;
}

export default function GuestList({
  guests,
  detailed = false,
}: GuestListProps) {
  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No guests found</div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (detailed) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loyalty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guests.map((guest) => (
              <tr key={guest._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {guest.firstName} {guest.lastName}
                    </div>
                    {guest.preferences.specialRequests.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Requests:{" "}
                        {guest.preferences.specialRequests
                          .slice(0, 2)
                          .join(", ")}
                        {guest.preferences.specialRequests.length > 2 && "..."}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{guest.email}</div>
                  <div className="text-sm text-gray-500">{guest.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guest.loyaltyProgram ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {guest.loyaltyProgram.tier}
                      </div>
                      <div className="text-sm text-gray-500">
                        {guest.loyaltyProgram.points} points
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(guest.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      guest.blacklisted
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {guest.blacklisted ? "Blacklisted" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {guests.map((guest) => (
        <div
          key={guest._id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <div className="font-medium text-gray-900">
              {guest.firstName} {guest.lastName}
            </div>
            <div className="text-sm text-gray-500">{guest.email}</div>
          </div>
          <div className="text-right">
            {guest.loyaltyProgram && (
              <div className="text-xs text-gray-500">
                {guest.loyaltyProgram.tier} Member
              </div>
            )}
            <div className="text-xs text-gray-400">
              {formatDate(guest.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
