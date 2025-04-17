import { useState, useEffect } from "react";
import instance from "../../api/instance";
import { useToastStore } from "../../lib/store";

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const fetchVehicles = async () => {
    try {
      const { data } = await instance.get("/vehicles/admin");
      setVehicles(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      setError("Failed to fetch vehicles");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const changeVehicleStatus = async (vehicleId, status) => {
    try {
      await instance.put(`/vehicles/admin/update-status/${vehicleId}`, {
        status,
      });

      addToast({
        type: "success",
        message: "Vehicle status updated successfully!",
      });

      fetchVehicles();
    } catch (err) {
      console.error("Failed to update vehicle status:", err);
      addToast({
        type: "error",
        message: "Failed to update vehicle status. Please try again.",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Group vehicles by user
  const vehiclesByUser = vehicles.reduce((acc, vehicle) => {
    const userId = vehicle.userId || vehicle._id;
    if (!acc[userId]) {
      acc[userId] = {
        userName: vehicle.owner || vehicle.userName || `User ${userId}`,
        vehicles: [],
      };
    }
    acc[userId].vehicles.push(vehicle);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">All Vehicles</h1>

      {vehicles.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            There are no vehicles registered in the system yet.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(vehiclesByUser).map(([userId, userData]) => (
            <div
              key={userId}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-100 px-6 py-3">
                <h2 className="text-lg font-semibold">{userData.userName}</h2>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Renewal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userData.vehicles.map((vehicle) => (
                    <tr key={vehicle._id || vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.type || vehicle.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.licensePlate || vehicle.plate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.year || vehicle.ManufactureYear}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(
                            vehicle.registrationDate || vehicle.licenseDate
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            (vehicle.status || "").toLowerCase() === "active"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                          ${
                            (vehicle.status || "").toLowerCase() ===
                              "under_maintenance" ||
                            (vehicle.status || "").toLowerCase() ===
                              "maintenance"
                              ? "bg-yellow-100 text-yellow-800"
                              : ""
                          }
                          ${
                            (vehicle.status || "").toLowerCase() === "inactive"
                              ? "bg-red-100 text-red-800"
                              : ""
                          }`}
                        >
                          {(vehicle.status || "").toLowerCase() ===
                            "under_maintenance" ||
                          (vehicle.status || "").toLowerCase() === "maintenance"
                            ? "Maintenance"
                            : (vehicle.status || "").charAt(0).toUpperCase() +
                              (vehicle.status || "").slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={(vehicle.status || "").toLowerCase()}
                          onChange={(e) =>
                            changeVehicleStatus(
                              vehicle._id || vehicle.id,
                              e.target.value
                            )
                          }
                          className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="under_maintenance">
                            Under Maintenance
                          </option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVehicles;
