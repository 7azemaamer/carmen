import { useState, useEffect } from "react";
import instance from "../../api/instance";

const Maintenance = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        const { data } = await instance.get("/maintenance");
        setMaintenanceRequests(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch maintenance requests:", err);
        setError("Failed to load your maintenance requests");
        setLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, []);

  // Function to format status with proper styling
  const getStatusBadge = (status) => {
    status = status.toLowerCase();
    if (status === "pending") {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    } else if (status === "in progress") {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          In Progress
        </span>
      );
    } else if (status === "completed") {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Maintenance Requests</h1>

      {maintenanceRequests.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            You don't have any maintenance requests yet.
          </p>
          <a
            href="/"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/70"
          >
            Submit a Reading
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {maintenanceRequests.map((request) => (
            <div
              key={request.requestId}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    Request #{request.requestId}
                  </h2>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Submitted on{" "}
                  {new Date(request.requestDate).toLocaleDateString()}
                </p>
                {request.reading && (
                  <p className="text-sm text-gray-600 mt-1">
                    Odometer Reading: {request.reading.toLocaleString()} km
                  </p>
                )}
              </div>

              <div className="px-6 py-4">
                <h3 className="text-md font-medium mb-2">Services:</h3>
                <ul className="list-disc pl-5 mb-4">
                  {request.services.map((service, index) => (
                    <li key={index} className="text-gray-700">
                      {service}
                    </li>
                  ))}
                </ul>

                {request.status.toLowerCase() === "completed" && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-1">Completed on:</h3>
                    <p className="text-gray-700">
                      {typeof request.completionDate === "string" &&
                      !request.completionDate.includes("will be updated")
                        ? new Date(request.completionDate).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                )}

                {request.adminNotes &&
                  !request.adminNotes.includes("will be updated") && (
                    <div>
                      <h3 className="text-md font-medium mb-1">Admin Notes:</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">
                        {request.adminNotes}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
