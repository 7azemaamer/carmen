import { useState, useEffect } from "react";
import instance from "../../api/instance";

const Readings = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const { data } = await instance.get("/odometer/history");

        const deduplicatedReadings = [];
        const seenKeys = new Set();

        data.forEach((reading) => {
          const dateOnly = new Date(reading.readingDate).toLocaleDateString();
          const key = `${reading.licensePlateNumber}-${reading.reading}-${dateOnly}`;

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            deduplicatedReadings.push(reading);
          }
        });

        const sortedReadings = [...deduplicatedReadings].sort(
          (a, b) => new Date(b.readingDate) - new Date(a.readingDate)
        );

        setReadings(sortedReadings);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch readings:", err);
        setError("Failed to load your reading history");
        setLoading(false);
      }
    };

    fetchReadings();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Odometer Reading History</h1>

      {readings.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            You haven't submitted any odometer readings yet.
          </p>
          <a
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-black/70"
          >
            Submit a Reading
          </a>
        </div>
      ) : (
        <>
          {readings.length > 0 && (
            <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-700 mb-1">Total Readings</p>
                  <p className="text-2xl font-bold">{readings.length}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-green-700 mb-1">Latest Reading</p>
                  <p className="text-2xl font-bold">
                    {readings[0]?.reading.toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading (km)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading, index) => {
                  const prevReading = readings[index + 1];
                  const change = prevReading
                    ? reading.reading - prevReading.reading
                    : 0;

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reading.vehicleType} - {reading.licensePlateNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reading.reading.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reading.readingDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {prevReading ? (
                          <div
                            className={`text-sm ${
                              change >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {change >= 0 ? "+" : ""}
                            {change.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Readings;
