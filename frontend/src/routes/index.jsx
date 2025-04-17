import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";

// Import pages later
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/user/Home";
import Vehicles from "../pages/user/Vehicles";
import Readings from "../pages/user/Readings";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";

// Admin pages
import AdminVehicles from "../pages/admin/Vehicles";
import AdminServices from "../pages/admin/Services";
import AdminRequests from "../pages/admin/Requests";
import Maintenance from "../pages/user/Maintenance";
import AdminSetup from "../pages/AdminSetup";
import FirstAdminSetup from "../pages/FirstAdminSetup";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // Public routes
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "unauthorized",
        element: <Unauthorized />,
      },
      {
        path: "adminauth",
        element: <AdminSetup />,
      },
      {
        path: "admin-first-setup",
        element: <FirstAdminSetup />,
      },

      // Protected routes for authenticated users
      {
        element: <PrivateRoute />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            path: "vehicles",
            element: <Vehicles />,
          },
          {
            path: "readings",
            element: <Readings />,
          },
          {
            path: "maintenance",
            element: <Maintenance />,
          },
        ],
      },

      // Protected routes for admin users
      {
        element: <PrivateRoute adminOnly={true} />,
        children: [
          {
            path: "admin/vehicles",
            element: <AdminVehicles />,
          },
          {
            path: "admin/services",
            element: <AdminServices />,
          },
          {
            path: "admin/requests",
            element: <AdminRequests />,
          },
        ],
      },

      // Catch all route
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
