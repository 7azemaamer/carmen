# Setting Up an Admin Account

This guide explains how to create an admin account and access admin features in the Vehicle Maintenance Tracker application.

## Creating an Admin Account

The backend has an endpoint specifically for creating admin accounts. To create an admin account, you'll need to make a POST request to the `/api/admin/create-admin` endpoint.

### Method 1: Using an API Client (like Postman)

1. Open your API client (Postman, Insomnia, etc.)
2. Create a new POST request to: `http://localhost:5154/api/admin/create-admin`
3. Set the request body to JSON with the following structure:
   ```json
   {
     "Username": "AdminUser",
     "Email": "admin@example.com",
     "Password": "SecurePassword123!",
     "PhoneNumber": "1234567890",
     "Address": "Admin Address"
   }
   ```
4. If this is the first admin being created, you might need to temporarily modify the AdminController in the backend to bypass the Admin role authorization check.

### Method 2: Using the Database Directly

If you have direct access to the database:

1. Access your SQL Server database
2. Find the Users table
3. Insert a new user with the Role field set to "Admin"
4. Make sure to hash the password using BCrypt

## Accessing Admin Features

Once you have an admin account, you can:

1. Log in using the admin credentials
2. The backend will provide a JWT token with admin privileges
3. Access the admin dashboard by navigating to `/admin` in the frontend

## Admin Capabilities

As an admin, you can:

1. **Manage Users** - View all users, change user roles
2. **Manage Vehicles** - View and manage all vehicles in the system
3. **Handle Maintenance Requests** - Update status of requests, add notes
4. **Manage Services** - Add, edit, or delete maintenance services

## Admin API Endpoints

The backend provides these admin-specific endpoints:

- `GET /api/admin/users` - Get all users
- `GET /api/admin/dashboard` - Get dashboard summary data
- `GET /api/admin/maintenance-requests` - Get all maintenance requests
- `PUT /api/admin/maintenance-requests/{requestId}` - Update maintenance status
- `GET /api/admin/services` - Get all services
- `POST /api/admin/services` - Add a new service
- `PUT /api/admin/services/{serviceId}` - Update a service
- `DELETE /api/admin/services/{serviceId}` - Delete a service

## Adding Services for Maintenance

To add maintenance services that users can select:

1. Log in as an admin
2. Make a POST request to `/api/admin/services` with:
   ```json
   {
     "ServiceName": "Oil Change",
     "ServiceCost": 1000,
     "MinimumOdometer": 0,
     "MaximumOdometer": 500000
   }
   ```
3. You can create multiple services with different odometer ranges if needed

## Updating Maintenance Requests

To update the status of a maintenance request:

1. Make a PUT request to `/api/admin/maintenance-requests/{requestId}` with:
   ```json
   {
     "Status": "Completed",
     "AdminNotes": "Service performed successfully on June 14, 2023"
   }
   ```
2. Status options are: "Pending", "In Progress", "Completed", "Canceled"
