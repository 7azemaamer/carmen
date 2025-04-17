import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "@/api/instance";
import { useToastStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CarFront,
  CheckCircle2,
  Clock,
  GaugeCircle,
  Info,
  Wrench,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

const Home = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestReading, setLatestReading] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [maintenanceStats, setMaintenanceStats] = useState({
    pending: 0,
    in_progress: 0,
  });

  const form = useForm({
    defaultValues: {
      vehicleId: "",
      reading: "",
    },
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [vehiclesRes, readingRes, servicesRes, maintenanceRes] =
        await Promise.all([
          instance.get("/vehicles"),
          instance.get("/odometer/history"),
          instance.get("/maintenance-services"),
          instance.get("/maintenance"),
        ]);

      setVehicles(vehiclesRes.data);

      const readings = readingRes.data;
      const latest = readings.length > 0 ? readings[0] : null;
      setLatestReading(latest);

      const mappedServices = servicesRes.data.map((service) => ({
        id: service.id,
        name: service.name,
        cost: service.cost,
        minOdometer: service.minOdometer,
        maxOdometer: service.maxOdometer,
      }));
      setAvailableServices(mappedServices);

      const stats = maintenanceRes.data.reduce(
        (acc, req) => {
          if (req.status.toLowerCase() === "pending") acc.pending++;
          if (req.status.toLowerCase() === "in_progress") acc.in_progress++;
          return acc;
        },
        { pending: 0, in_progress: 0 }
      );
      setMaintenanceStats(stats);

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      addToast({
        type: "error",
        message: "Failed to load your dashboard. Please try again.",
      });
      setLoading(false);
    }
  };

  const handleReadingSubmit = async (values) => {
    try {
      const reading = parseInt(values.reading);
      if (reading <= latestReading?.reading) {
        form.setError("reading", {
          type: "manual",
          message: "New reading must be higher than the previous reading",
        });
        return;
      }

      // Submit the reading but we don't need to use the response
      await instance.post("/odometer", {
        VehicleId: parseInt(values.vehicleId),
        Reading: reading,
        ReadingDate: new Date().toISOString(),
      });

      // Filter services for the current reading
      const filteredServices = availableServices.filter(
        (service) =>
          reading >= service.minOdometer && reading <= service.maxOdometer
      );

      // Only show services that are applicable for this reading
      if (filteredServices.length > 0) {
        // Temporarily store only the filtered services for display
        setAvailableServices(filteredServices);
        setShowServiceModal(true);
        addToast({
          type: "info",
          message:
            "Reading submitted! Services available for your odometer reading.",
          duration: 3000,
        });
      } else {
        // No services available for this reading
        addToast({
          type: "success",
          message: "✅ Reading submitted successfully!",
          description: `Your ${reading.toLocaleString()} km reading has been recorded.`,
          duration: 4000,
        });
        form.reset();
        fetchUserData();
      }
    } catch (err) {
      console.error("Failed to submit reading:", err);
      addToast({
        type: "error",
        message: "❌ Failed to submit reading",
        description: err.response?.data?.message || "Please try again.",
        duration: 4000,
      });
    }
  };

  const handleServiceSelection = async () => {
    if (selectedServices.length === 0) {
      addToast({
        type: "error",
        message: "❌ No services selected",
        description: "Please select at least one service",
        duration: 4000,
      });
      return;
    }

    try {
      const reading = parseInt(form.getValues("reading"));
      const vehicleId = parseInt(form.getValues("vehicleId"));

      const selectedVehicle = vehicles.find(
        (v) => (v._id || v.id).toString() === vehicleId.toString()
      );
      const vehicleInfo = selectedVehicle
        ? `${selectedVehicle.type || selectedVehicle.vehicleType} ${
            selectedVehicle.licensePlate || selectedVehicle.licensePlateNumber
          }`
        : "your vehicle";

      console.log("Selected Services:", selectedServices);
      console.log("Available Services:", availableServices);

      const requests = selectedServices.map((serviceId) => {
        const service = availableServices.find(
          (s) => s.id.toString() === serviceId
        );
        console.log("Submitting service:", service);
        return instance.post("/maintenance", {
          VehicleId: vehicleId,
          ServiceId: parseInt(serviceId),
          Reading: reading,
        });
      });

      await Promise.all(requests);

      await instance.put(`/vehicles/admin/update-status/${vehicleId}`, {
        Status: "under_maintenance",
      });

      const serviceNames = selectedServices
        .map((serviceId) => {
          const service = availableServices.find(
            (s) => s.id.toString() === serviceId
          );
          return service ? service.name : "Service";
        })
        .join(", ");

      addToast({
        type: "success",
        message: "✅ Maintenance requests submitted!",
        description: `${serviceNames} for ${vehicleInfo} scheduled. Status: Under Maintenance`,
        duration: 5000,
      });

      setShowServiceModal(false);
      setSelectedServices([]);
      form.reset();
      fetchUserData();
    } catch (err) {
      console.error("Failed to submit maintenance request:", err);
      addToast({
        type: "error",
        message: "❌ Failed to submit maintenance request",
        description: err.response?.data?.message || "Please try again.",
        duration: 4000,
      });
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices((prev) => {
      const idStr = serviceId.toString();
      const exists = prev.includes(idStr);
      return exists ? prev.filter((id) => id !== idStr) : [...prev, idStr];
    });
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  const daysSinceLastReading = latestReading
    ? Math.floor(
        (new Date() - new Date(latestReading.date)) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Invalid date format:", error);
      return "Unknown date";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vehicle maintenance and odometer readings
          </p>
        </div>
        <Button
          onClick={() => navigate("/vehicles")}
          className="cursor-pointer"
        >
          <CarFront className="mr-2 h-4 w-4" />
          My Vehicles
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Reading
            </CardTitle>
            <GaugeCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestReading ? (
              <>
                <div className="text-2xl font-bold">
                  {latestReading.reading.toLocaleString()} km
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated{" "}
                  {latestReading?.date
                    ? formatDate(latestReading.date)
                    : "Unknown"}
                </div>
                {daysSinceLastReading > 7 && (
                  <Alert className="mt-3" variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      It's been {daysSinceLastReading} days since your last
                      update
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No readings recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Status
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Next Service</span>
                <Badge variant="outline">
                  {latestReading
                    ? `${(
                        (Math.floor(latestReading.reading / 10000) + 1) *
                        10000
                      ).toLocaleString()} km`
                    : "N/A"}
                </Badge>
              </div>
              {latestReading && (
                <Progress
                  value={((latestReading.reading % 10000) / 10000) * 100}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {maintenanceStats.pending > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/10 text-yellow-700"
                  >
                    {maintenanceStats.pending} Pending
                  </Badge>
                )}
                {maintenanceStats.in_progress > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-700"
                  >
                    {maintenanceStats.in_progress} In Progress
                  </Badge>
                )}
                {maintenanceStats.pending === 0 &&
                  maintenanceStats.in_progress === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No active requests
                    </span>
                  )}
              </div>
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => navigate("/maintenance")}
              >
                View Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit New Reading</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleReadingSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="vehicleId"
                rules={{ required: "Please select a vehicle" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem
                            key={vehicle._id || vehicle.id}
                            value={(vehicle._id || vehicle.id).toString()}
                          >
                            {vehicle.type || vehicle.vehicleType} -{" "}
                            {vehicle.licensePlate || vehicle.licensePlateNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reading"
                rules={{
                  required: "Please enter the current reading",
                  pattern: {
                    value: /^\d+$/,
                    message: "Please enter a valid number",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Reading (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full cursor-pointer">
                Submit Reading
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog
        open={showServiceModal}
        onOpenChange={(open) => {
          if (!open) {
            // Restore all services when closing the modal
            fetchUserData();
          }
          setShowServiceModal(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose Service</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select the maintenance services you'd like to perform for your
                vehicle.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-4">
                {availableServices.map((service) => {
                  // Ensure we have a valid service ID
                  const serviceId = service.id || service.serviceId;
                  if (!serviceId) return null; // Skip invalid services

                  const serviceIdStr = serviceId.toString();
                  return (
                    <Card
                      key={serviceIdStr}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedServices.includes(serviceIdStr)
                          ? "border-primary"
                          : "hover:border-muted"
                      )}
                      onClick={() => toggleService(serviceId)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "rounded-full p-1",
                              selectedServices.includes(serviceIdStr)
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {service.name || service.serviceName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              E£
                              {(
                                service.cost || service.serviceCost
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowServiceModal(false);
                setSelectedServices([]);

                const reading = parseInt(form.getValues("reading"));
                // Show the awesome success message on cancel too
                addToast({
                  type: "success",
                  message: "✅ Reading submitted successfully!",
                  description: `Your ${reading.toLocaleString()} km reading has been recorded.`,
                  duration: 4000,
                });

                form.reset();
                fetchUserData();
              }}
              className="cursor-pointer"
            >
              Skip Services
            </Button>
            <Button onClick={handleServiceSelection} className="cursor-pointer">
              Confirm Services
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
