/**
 * AI Service for integration with Gemini API
 */

const API_KEY = "AIzaSyCgoMNJ2pVcN0K_xI1WFx09nxpG1m_aBFs";
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `# Vehicle Maintenance Assistant - Expert System

You are a specialized Vehicle Maintenance Assistant integrated within the Vehicle Maintenance Tracking System. Your primary purpose is to provide expert guidance on vehicle maintenance topics and help users navigate the application effectively.

## SYSTEM CAPABILITIES AND KNOWLEDGE DOMAIN

You have specialized knowledge of:
- Modern vehicle maintenance requirements and best practices
- Service intervals based on vehicle make, model, and mileage
- Diagnostic information for common vehicle issues
- The structure and features of the Vehicle Maintenance Tracking application
- Details about the user's vehicles, service history, and maintenance records

## APPLICATION STRUCTURE
The application has these key sections:

1. **User Dashboard** - Central hub showing vehicles, upcoming maintenance, and status of requests
2. **Vehicle Management** - For adding, viewing, and managing user vehicles
3. **Maintenance Services** - Services organized by mileage ranges (e.g., 5,000-10,000 miles)
4. **Maintenance Requests** - For booking services and tracking request statuses
5. **Odometer Readings** - For updating vehicle mileage to receive appropriate service recommendations

## APPLICATION ROUTES
Always provide specific navigation paths when guiding users:

- Dashboard: "/user/dashboard" - Main user hub with overview of vehicles and maintenance
- Vehicles: "/user/vehicles" - Where users manage, add, and update their vehicles
- Maintenance Requests: "/user/maintenance-requests" - For tracking service bookings
- Vehicle Details: "/user/vehicles/:id" - To view a specific vehicle and update its odometer
- Profile: "/user/profile" - Where users update their account settings
- Login: "/login" - For returning users to access their account
- Register: "/register" - For new users to create an account

## SYSTEM SERVICES AND DATA

### Available Maintenance Services
The system currently offers these service ranges:
- 0-5,000 miles: Oil change, Basic inspection
- 5,000-15,000 miles: Tire rotation, Filter replacement, Brake inspection
- 15,000-30,000 miles: Transmission service, Full system check
- 30,000-50,000 miles: Major service, Cooling system flush
- 50,000+ miles: Deep diagnostics, Preventative maintenance

Each range has specific services that are recommended when a vehicle's odometer reading falls within that range.

### User Vehicle Information
When responding to users about their vehicles, reference the following information:
- Their current vehicles and basic details (make, model, year, license plate)
- Current odometer readings for each vehicle
- Maintenance history including past services and dates
- Upcoming recommended maintenance based on mileage

### Odometer Reading History
The system tracks odometer reading history to:
- Calculate vehicle usage patterns
- Predict upcoming maintenance needs
- Recommend timely service appointments
- Track vehicle depreciation

## PRIVACY AND SECURITY GUIDELINES

1. **NEVER reveal sensitive user data** - Do not mention user IDs, full email addresses, or any sensitive information provided to you about the user
2. **DO NOT identify users by role** - Do not greet users as "Admin" or include their role in responses
3. **AVOID referencing internal user context** - While you have access to user information for context, never mention this data in responses
4. **USE first names only** - If greeting users personally, use only their first name or username, but never reveal email addresses
5. **PROTECT user privacy** - Never share one user's information with another user

## INTERACTION GUIDELINES

1. **Be concise and professional** - Provide clear, accurate information without unnecessary elaboration
2. **Stay within system context** - Only provide information related to vehicle maintenance and using this application
3. **Use technical accuracy** - When discussing maintenance topics, use correct terminology and accurate information
4. **Provide practical guidance** - Help users understand how to use the application to manage their vehicles

## SPECIFIC ASSISTANCE AREAS

You should be ready to assist with:
- Explaining vehicle maintenance concepts and best practices
- Guiding users on how to use specific features of the application
- Providing information about recommended maintenance schedules
- Helping troubleshoot issues with vehicle service booking or management
- Interpreting maintenance request statuses and next steps

## RESPONSE FORMAT

When answering questions:
- Use bullet points for multi-step instructions
- Include specific navigation paths (e.g., "Go to Vehicles → Add Vehicle")
- Highlight important terms using **bold text**
- Keep responses focused and relevant to vehicle maintenance
- If appropriate, suggest related application features that may help the user

Remember that your core function is to make vehicle maintenance knowledge accessible and to help users effectively use this application to maintain their vehicles, while always prioritizing user privacy and security.`;

const KNOWLEDGE_BASE = {
  maintenance: {
    booking:
      "To book a maintenance service, go to the Dashboard and click on 'Book Service'. Select your vehicle, choose the services you need based on your odometer reading, and submit the request.",
    status:
      "Maintenance requests can have the following statuses: 'Pending', 'Approved', 'In Progress', or 'Completed'. You can check the status on your Dashboard.",
    cancel:
      "To cancel a maintenance request, find it on your Dashboard and click the 'Cancel' button. Note that you can only cancel requests that are still in 'Pending' status.",
  },
  vehicles: {
    add: "To add a vehicle, go to 'My Vehicles' page and click on 'Add Vehicle'. Fill in the required details like make, model, year, and license plate number.",
    readings:
      "To update your odometer reading, go to your vehicle's details page and click on 'Update Reading'. Regular updates help us recommend the right maintenance services.",
    details:
      "Vehicle details include make, model, year, license plate, and current odometer reading. You can view full maintenance history from the vehicle details page.",
  },
  services: {
    types:
      "We offer various service types including oil change, tire rotation, brake inspection, filter replacement, and full service packages. Services are recommended based on your vehicle's odometer reading.",
    pricing:
      "Service pricing depends on the type of service and your vehicle's make and model. You can see the exact price when booking a service.",
    intervals:
      "Service intervals are typically based on mileage. For example, oil changes are recommended every 5,000-7,500 miles depending on the vehicle and oil type.",
    available_ranges: [
      {
        range: "0-5,000 miles",
        services: ["Oil Change", "Basic Inspection", "Fluid Top-up"],
      },
      {
        range: "5,000-15,000 miles",
        services: [
          "Tire Rotation",
          "Air Filter Replacement",
          "Brake Inspection",
          "Oil Change",
        ],
      },
      {
        range: "15,000-30,000 miles",
        services: [
          "Transmission Service",
          "Full System Check",
          "Cabin Filter Replacement",
          "Brake Service",
        ],
      },
      {
        range: "30,000-50,000 miles",
        services: [
          "Major Service",
          "Cooling System Flush",
          "Spark Plug Replacement",
          "Fuel Filter",
        ],
      },
      {
        range: "50,000+ miles",
        services: [
          "Deep Diagnostics",
          "Preventative Maintenance",
          "Timing Belt Service",
          "Suspension Check",
        ],
      },
    ],
  },
  common_questions: {
    oil_change:
      "Regular oil changes are crucial for engine health. Most modern vehicles should have oil changed every 5,000-7,500 miles or 6 months. However, the exact interval depends on your specific vehicle model, driving conditions, and the type of oil used. You can find the recommended interval in your vehicle's manual or in the service recommendations in this application.",
    tire_rotation:
      "Tire rotation should typically be done every 5,000-8,000 miles to ensure even tire wear and extend tire life. The exact pattern of rotation depends on whether your vehicle is front-wheel, rear-wheel, or all-wheel drive.",
    brake_service:
      "Brake service intervals vary based on driving habits and conditions. Generally, brake pads should be inspected every 10,000-20,000 miles. Signs you need brake service include squeaking or grinding noises, vibration when braking, or a soft brake pedal.",
    filter_replacement:
      "Your vehicle has several important filters: air filter (replace every 15,000-30,000 miles), fuel filter (30,000-50,000 miles), and cabin air filter (15,000-25,000 miles). Regular replacement ensures optimal performance and air quality.",
    battery_maintenance:
      "Vehicle batteries typically last 3-5 years. Signs of a failing battery include slow engine cranking, dimming headlights, or electronic issues. Our services include battery testing and replacement when needed.",
  },
  navigation_help: {
    dashboard:
      "The Dashboard is your home page, showing your vehicles, recent maintenance requests, and recommended services based on your vehicle's mileage.",
    vehicles_page:
      "The Vehicles page lets you manage your vehicles: add new ones, view details, update odometer readings, and see maintenance history for each vehicle.",
    maintenance_page:
      "The Maintenance page shows your maintenance history and lets you track the status of current maintenance requests.",
    service_booking:
      "To book a service, start from the Dashboard and click 'Book Service', or go to your vehicle details and click the same button.",
  },
  app_routes: {
    dashboard: {
      path: "/user/dashboard",
      description: "Home page with vehicle overview and upcoming maintenance",
    },
    vehicles: {
      path: "/user/vehicles",
      description:
        "Manage your vehicles, add new ones, or update existing ones",
    },
    maintenance_requests: {
      path: "/user/maintenance-requests",
      description:
        "View and manage all maintenance requests and their statuses",
    },
    odometer: {
      path: "/user/vehicles/:id",
      description: "Update odometer readings for a specific vehicle",
    },
    profile: {
      path: "/user/profile",
      description: "Update your profile information and preferences",
    },
    admin_dashboard: {
      path: "/admin/dashboard",
      description: "Admin overview of all system activities",
    },
    admin_services: {
      path: "/admin/services",
      description: "Manage maintenance service types and pricing",
    },
    admin_requests: {
      path: "/admin/requests",
      description: "Process and manage user maintenance requests",
    },
    login: {
      path: "/login",
      description: "Log in to your account",
    },
    register: {
      path: "/register",
      description: "Create a new account",
    },
  },
  sample_vehicles: {
    vehicle_types: [
      "Sedan",
      "SUV",
      "Truck",
      "Hatchback",
      "Minivan",
      "Crossover",
      "Convertible",
      "Coupe",
    ],
    popular_makes: [
      "Toyota",
      "Honda",
      "Ford",
      "Chevrolet",
      "Nissan",
      "Hyundai",
      "Kia",
      "Tesla",
      "BMW",
      "Mercedes-Benz",
    ],
    mileage_tracking:
      "The system tracks odometer readings over time, allowing you to see how quickly your vehicle accumulates mileage and helping predict when maintenance will be needed.",
    maintenance_history:
      "Each vehicle stores a complete maintenance history, including all past service records, dates, costs, and odometer readings at the time of service.",
  },
  reading_history: {
    importance:
      "Regular odometer reading updates are essential for accurate maintenance recommendations. The system uses your reading history to calculate usage patterns and suggest timely service intervals.",
    updating:
      "To update an odometer reading, go to your vehicle details page and click 'Update Reading'. You should update readings at least once a month for the most accurate maintenance recommendations.",
    viewing:
      "You can view your complete reading history on the vehicle details page, including graphs showing mileage accumulation over time.",
    alerts:
      "The system generates alerts when your vehicle is approaching maintenance milestones based on your reading history and service intervals.",
  },
};

export const getAiResponse = async (userMessage) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const userQuery = userMessage.toLowerCase();

  if (
    userQuery.includes("how to get to") ||
    userQuery.includes("where is") ||
    userQuery.includes("how do i find")
  ) {
    if (userQuery.includes("dashboard") || userQuery.includes("home page")) {
      return `You can access the dashboard at ${KNOWLEDGE_BASE.app_routes.dashboard.path} — this is your home page where you'll see your vehicles and upcoming maintenance.`;
    } else if (userQuery.includes("vehicle") || userQuery.includes("my car")) {
      return `The Vehicles page is located at ${KNOWLEDGE_BASE.app_routes.vehicles.path} — here you can manage your vehicles, add new ones, or update existing ones.`;
    } else if (
      userQuery.includes("maintenance") ||
      userQuery.includes("request")
    ) {
      return `You can view all your maintenance requests at ${KNOWLEDGE_BASE.app_routes.maintenance_requests.path} — this shows all your service requests and their current status.`;
    } else if (userQuery.includes("profile") || userQuery.includes("account")) {
      return `Your profile page is at ${KNOWLEDGE_BASE.app_routes.profile.path} — here you can update your personal information and preferences.`;
    } else if (
      userQuery.includes("odometer") ||
      userQuery.includes("mileage")
    ) {
      return `To update a vehicle's odometer reading, go to ${KNOWLEDGE_BASE.app_routes.vehicles.path} first, then select the specific vehicle to update its mileage.`;
    } else if (userQuery.includes("login")) {
      return `You can log in to your account at ${KNOWLEDGE_BASE.app_routes.login.path}.`;
    } else if (
      userQuery.includes("register") ||
      userQuery.includes("sign up")
    ) {
      return `To create a new account, visit ${KNOWLEDGE_BASE.app_routes.register.path}.`;
    }
  }

  // Original pattern matching
  if (userQuery.includes("book") && userQuery.includes("service")) {
    return KNOWLEDGE_BASE.maintenance.booking;
  } else if (
    userQuery.includes("maintenance") &&
    userQuery.includes("status")
  ) {
    return KNOWLEDGE_BASE.maintenance.status;
  } else if (userQuery.includes("add") && userQuery.includes("vehicle")) {
    return KNOWLEDGE_BASE.vehicles.add;
  } else if (userQuery.includes("odometer") || userQuery.includes("reading")) {
    return KNOWLEDGE_BASE.vehicles.readings;
  } else if (
    userQuery.includes("service") &&
    (userQuery.includes("type") || userQuery.includes("kind"))
  ) {
    return KNOWLEDGE_BASE.services.types;
  } else if (userQuery.includes("price") || userQuery.includes("cost")) {
    return KNOWLEDGE_BASE.services.pricing;
  } else if (userQuery.includes("how") && userQuery.includes("cancel")) {
    return KNOWLEDGE_BASE.maintenance.cancel;
  } else if (
    userQuery.includes("interval") ||
    (userQuery.includes("when") && userQuery.includes("service"))
  ) {
    return KNOWLEDGE_BASE.services.intervals;
  } else if (userQuery.includes("oil") && userQuery.includes("change")) {
    return KNOWLEDGE_BASE.common_questions.oil_change;
  } else if (userQuery.includes("tire") && userQuery.includes("rotation")) {
    return KNOWLEDGE_BASE.common_questions.tire_rotation;
  } else if (userQuery.includes("brake")) {
    return KNOWLEDGE_BASE.common_questions.brake_service;
  } else if (userQuery.includes("filter")) {
    return KNOWLEDGE_BASE.common_questions.filter_replacement;
  } else if (userQuery.includes("battery")) {
    return KNOWLEDGE_BASE.common_questions.battery_maintenance;
  } else if (
    userQuery.includes("dashboard") ||
    userQuery.includes("home page")
  ) {
    return KNOWLEDGE_BASE.navigation_help.dashboard;
  } else if (userQuery.includes("vehicles page")) {
    return KNOWLEDGE_BASE.navigation_help.vehicles_page;
  } else if (userQuery.includes("maintenance page")) {
    return KNOWLEDGE_BASE.navigation_help.maintenance_page;
  }

  return `I'm your Vehicle Maintenance Assistant. I can help with:

• **Vehicle maintenance questions** - oil changes, tire rotations, etc.
• **Using this application** - finding features, booking services
• **Understanding service schedules** - when your vehicle needs maintenance
• **Tracking maintenance requests** - checking status and next steps

What specific help do you need today with your vehicle maintenance?`;
};

export const callGeminiApi = async (message, history) => {
  try {
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    if (history.length <= 1) {
      formattedHistory.unshift({
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      });
    }

    formattedHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: formattedHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${await response.text()}`
      );
    }

    const data = await response.json();

    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected API response format:", data);
      throw new Error("Invalid response format from Gemini API");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return await getAiResponse(message);
  }
};

export default {
  getAiResponse,
  callGeminiApi,
};
