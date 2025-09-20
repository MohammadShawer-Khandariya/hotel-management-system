"use client";

import { useState } from "react";
import { Room } from "@/types";
import { API_BASE_URL } from "@/lib/config";

interface RoomCardProps {
  room: Room;
  onUpdate?: () => void;
}

export default function RoomCard({ room, onUpdate }: RoomCardProps) {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Occupied":
        return "bg-red-100 text-red-800";
      case "Not Available":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: Room["type"]) => {
    switch (type) {
      case "Single":
        return "bg-blue-100 text-blue-800";
      case "Double":
        return "bg-purple-100 text-purple-800";
      case "Suite":
        return "bg-yellow-100 text-yellow-800";
      case "Deluxe":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateRoomStatus = async (newStatus: Room["status"]) => {
    try {
      // setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/rooms/${room._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        onUpdate?.();
      }
    } catch (error) {
      console.error("Error updating room status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Room {room.roomNumber}
          </h3>
          <p className="text-sm text-gray-500">Floor {room.floor}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${room.pricePerNight}
          </p>
          <p className="text-xs text-gray-500">per night</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
            room.type,
          )}`}
        >
          {room.type}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            room.status,
          )}`}
        >
          {room.status}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">
          Max Occupancy: {room.maxOccupancy}
        </p>
        <div className="flex flex-wrap gap-1">
          {room.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="text-xs text-gray-500">
              +{room.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {room.status !== "Available" && (
          <button
            onClick={() => updateRoomStatus("Available")}
            disabled={loading}
            className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "..." : "Make Available"}
          </button>
        )}
        {room.status !== "Occupied" && (
          <button
            onClick={() => updateRoomStatus("Occupied")}
            disabled={loading}
            className="flex-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "..." : "Mark Occupied"}
          </button>
        )}
        {room.status !== "Not Available" && (
          <button
            onClick={() => updateRoomStatus("Not Available")}
            disabled={loading}
            className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "..." : "Disable"}
          </button>
        )}
      </div>
    </div>
  );
}
