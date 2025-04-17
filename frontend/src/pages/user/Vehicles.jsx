import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Car, CarFront, Plus, Trash2, Edit } from "lucide-react";
import { useForm } from "react-hook-form";

const STATUS_VARIANTS = {
  Active: "success",
  under_maintenance: "warning",
  inactive: "secondary",
  pending: "outline",
};

const formatStatus = (status) => {
  switch (status) {
    case "under_maintenance":
      return "Under Maintenance";
    case "Active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "pending":
      return "Pending";
    default:
      return status;
  }
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { addToast } = useToastStore();

  const form = useForm({
    defaultValues: {
      vehicleType: "",
      licensePlateNumber: "",
      manufactureYear: "",
    },
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (editingVehicle) {
      form.reset({
        vehicleType: editingVehicle.vehicleType,
        licensePlateNumber: editingVehicle.licensePlateNumber,
        manufactureYear: editingVehicle.year.toString(),
      });
    } else {
      form.reset({
        vehicleType: "",
        licensePlateNumber: "",
        manufactureYear: "",
      });
    }
  }, [editingVehicle, form]);

  const fetchVehicles = async () => {
    try {
      const { data } = await instance.get("/vehicles");
      const transformedData = data.map((vehicle) => ({
        vehicleId: vehicle._id,
        vehicleType: vehicle.type,
        licensePlateNumber: vehicle.licensePlate,
        year: vehicle.year,
        status: vehicle.status,
        registrationDate: vehicle.registrationDate,
      }));
      setVehicles(transformedData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      addToast({
        type: "error",
        message: "Failed to load your vehicles. Please try again.",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        VehicleType: values.vehicleType,
        LicensePlateNumber: values.licensePlateNumber,
        ManufactureYear: parseInt(values.manufactureYear),
        RegistrationDate:
          editingVehicle?.registrationDate || new Date().toISOString(),
      };

      if (editingVehicle) {
        await instance.put(`/vehicles/${editingVehicle.vehicleId}`, submitData);
        addToast({
          type: "success",
          message: "Vehicle updated successfully!",
        });
      } else {
        await instance.post("/vehicles", submitData);
        addToast({
          type: "success",
          message: "Vehicle added successfully!",
        });
      }

      setShowAddModal(false);
      setEditingVehicle(null);
      form.reset();
      fetchVehicles();
    } catch (err) {
      console.error("Failed to save vehicle:", err);
      addToast({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to save vehicle. Please try again.",
      });
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      await instance.delete(`/vehicles/${vehicleId}`);
      addToast({
        type: "success",
        message: "Vehicle deleted successfully!",
      });
      fetchVehicles();
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
      addToast({
        type: "error",
        message:
          "Vehicle deletion is not available yet. Please contact an administrator for assistance.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-primary-900 animate-pulse">
          Loading your vehicles...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            My Vehicles
          </h1>
          <p className="text-sm text-primary-700">
            Manage your registered vehicles
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="transition-all duration-200 hover:scale-105 cursor-pointer bg-primary hover:bg-primary-600 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border border-primary-100 shadow-sm">
          <CardContent className="flex h-[300px] flex-col items-center justify-center gap-4">
            <Car className="h-12 w-12 text-primary-400" />
            <div className="text-center">
              <p className="font-medium text-primary-900">
                No vehicles registered
              </p>
              <p className="text-sm text-primary-600">
                Add your first vehicle to start tracking maintenance
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="transition-all duration-200 hover:scale-105 cursor-pointer bg-primary hover:bg-primary-600 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.vehicleId}
              className="relative overflow-hidden border border-primary-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CarFront className="h-5 w-5 text-primary-400" />
                    <CardTitle className="text-lg text-primary-900">
                      {vehicle.vehicleType || "Vehicle"} -{" "}
                      {vehicle.licensePlateNumber}
                    </CardTitle>
                  </div>
                  <Badge
                    variant={STATUS_VARIANTS[vehicle.status] || "secondary"}
                  >
                    {formatStatus(vehicle.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Year</p>
                    <p className="text-primary-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-600">
                      Registration Date
                    </p>
                    <p className="text-primary-900">
                      {new Date(vehicle.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setShowAddModal(true);
                          }}
                          className="h-8 w-8 transition hover:text-blue-500 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Vehicle</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(vehicle.vehicleId)}
                          className="h-8 w-8 transition hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Vehicle</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVehicle(null);
            form.reset();
          }
          setShowAddModal(open);
        }}
      >
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogContent className="bg-white shadow-lg border-0 sm:rounded-lg overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-primary-100">
            <DialogTitle className="text-xl font-semibold text-primary-900">
              {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 px-6 py-4"
            >
              <FormField
                control={form.control}
                name="vehicleType"
                rules={{
                  required: "Vehicle type is required",
                  minLength: {
                    value: 2,
                    message: "Vehicle type must be at least 2 characters",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-900 font-medium">
                      Vehicle
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Toyota, Honda, etc."
                        className="border-primary-200 focus:border-primary focus:ring-primary text-primary-900 placeholder:text-primary-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlateNumber"
                rules={{ required: "License plate is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-900 font-medium">
                      License Plate
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter license plate Eg. ABC - 123"
                        className="border-primary-200 focus:border-primary focus:ring-primary text-primary-900 placeholder:text-primary-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufactureYear"
                rules={{
                  required: "Year is required",
                  pattern: {
                    value: /^\d{4}$/,
                    message: "Please enter a valid year (YYYY)",
                  },
                  validate: (value) => {
                    const year = parseInt(value);
                    const currentYear = new Date().getFullYear();
                    if (year < 1900 || year > currentYear + 1) {
                      return `Year must be between 1900 and ${currentYear + 1}`;
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-900 font-medium">
                      Year
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter vehicle year (YYYY)"
                        className="border-primary-200 focus:border-primary focus:ring-primary text-primary-900 placeholder:text-primary-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-primary-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVehicle(null);
                    form.reset();
                  }}
                  className="transition-all duration-200 hover:bg-primary-50 cursor-pointer border-primary-200 text-primary-700 hover:text-primary-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="transition-all duration-200 hover:scale-105 cursor-pointer bg-primary hover:bg-primary-600 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : editingVehicle
                    ? "Update Vehicle"
                    : "Add Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;
