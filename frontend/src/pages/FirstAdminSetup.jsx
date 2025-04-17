import { useState } from "react";
import { useForm } from "react-hook-form";
import instance from "../api/instance";
import { useToastStore } from "../lib/store";

const FirstAdminSetup = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [userId, setUserId] = useState(null);
  const { addToast } = useToastStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === "1234") {
      setAuthenticated(true);
    } else {
      addToast({
        type: "error",
        message: "Incorrect password",
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // First, register a normal user account
      const response = await instance.post("/auth/register", {
        Username: data.username,
        Email: data.email,
        Password: data.password,
        PhoneNumber: data.phone,
        Address: data.address,
      });

      console.log("Registration response:", response.data);

      // Extract the user ID from the response
      const userId = response.data.user?.id;

      if (userId) {
        setUserId(userId);
        setRegistered(true);
        addToast({
          type: "success",
          message:
            "User registered successfully! See instructions below to complete setup.",
        });
      } else {
        addToast({
          type: "warning",
          message:
            "User registered but couldn't determine user ID. Check database.",
        });
      }

      reset();
    } catch (err) {
      console.error("Failed to register user:", err);

      addToast({
        type: "error",
        message: err.response?.data?.message || "Failed to register user",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            First Admin Setup
          </h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              This page is for creating the very first admin account in the
              system. It should be disabled after initial setup.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Setup Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter setup password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Access First Admin Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">First Admin Setup</h1>
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 font-bold">
              IMPORTANT SECURITY NOTICE
            </p>
            <p className="text-sm text-red-700 mt-1">
              This page creates the first admin account by registering a normal
              user and then providing SQL instructions to manually upgrade the
              account. After creating the first admin, this page should be
              disabled or removed.
            </p>
          </div>
        </div>
      </div>

      {!registered ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Register Admin User</h2>
          <p className="mb-4 text-gray-700">
            Step 1: Register a new user account that will be promoted to admin.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                {...register("username", { required: "Username is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                {...register("phone")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                {...register("address")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register User"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Complete Admin Setup</h2>
          <p className="mb-4 text-gray-700">
            Step 2: Execute the following SQL query to promote the user to
            admin.
          </p>

          <div className="bg-gray-800 text-gray-200 p-4 rounded-md mb-6 overflow-x-auto">
            <pre>
              {`-- Connect to your database and run this SQL query:\n\nUPDATE Users\nSET Role = 'Admin'\nWHERE UserId = ${
                userId || "[User ID from registration]"
              };`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `UPDATE Users SET Role = 'Admin' WHERE UserId = ${
                    userId || "[User ID from registration]"
                  };`
                );
                addToast({
                  type: "success",
                  message: "SQL query copied to clipboard",
                });
              }}
              className="mt-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
            >
              Copy
            </button>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <p className="text-sm text-green-700">
              After running the SQL query, you can log in with your new admin
              credentials and use the admin features.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Login
            </button>
            <button
              onClick={() => {
                setRegistered(false);
                setUserId(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Register Another User
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstAdminSetup;
