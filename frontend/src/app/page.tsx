"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Room, Guest } from "@/types";
import RoomCard from "@/components/RoomCard";
import GuestList from "@/components/GuestList";

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  useEffect(() => {
    checkConnection();
    fetchData();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      setConnectionStatus(response.ok ? "connected" : "disconnected");
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, guestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rooms`),
        fetch(`${API_BASE_URL}/api/guests`),
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        if (roomsData.success && roomsData.data.rooms) {
          setRooms(roomsData.data.rooms);
        }
      }

      if (guestsRes.ok) {
        const guestsData = await guestsRes.json();
        if (guestsData.success && guestsData.data.guests) {
          setGuests(guestsData.data.guests);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    console.log(rooms);
    const availableRooms = rooms.filter(
      (room) => room.status === "Available",
    ).length;
    const occupiedRooms = rooms.filter(
      (room) => room.status === "Occupied",
    ).length;
    const totalRevenue = occupiedRooms * 150; // Approximate

    return {
      availableRooms,
      occupiedRooms,
      totalRevenue,
      totalGuests: guests.length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Hotel Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Backend:{" "}
                {connectionStatus === "connected"
                  ? "Connected"
                  : "Disconnected"}
              </span>
              <div
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "disconnected"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {["overview", "rooms", "guests"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Overview
              </h1>
              <button
                onClick={fetchData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Available Rooms
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.availableRooms}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">◉</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Occupied Rooms
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.occupiedRooms}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Guests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalGuests}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Daily Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${stats.totalRevenue}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Room Status
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {rooms.slice(0, 6).map((room) => (
                      <RoomCard
                        key={room._id}
                        room={room}
                        onUpdate={fetchData}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Recent Guests
                  </h2>
                  <GuestList guests={guests.slice(0, 5)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Room Management
              </h1>
              <div className="text-sm text-gray-500">
                {rooms.length} total rooms
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} onUpdate={fetchData} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "guests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Guest Management
              </h1>
              <div className="text-sm text-gray-500">
                {guests.length} registered guests
              </div>
            </div>
            <div className="bg-white shadow rounded-lg">
              <GuestList guests={guests} detailed={true} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
