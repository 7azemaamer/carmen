import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "../../api/instance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceItems, setServiceItems] = useState([{ name: "", price: 0 }]);
  const [duplicatesFound, setDuplicatesFound] = useState(false);
  const [serviceErrors, setServiceErrors] = useState({});
  const form = useForm({
    defaultValues: {
      rangeStart: "",
      rangeEnd: "",
    },
    mode: "onChange",
  });

  const fetchServices = async () => {
    try {
      const { data } = await instance.get("/maintenance-services");

      const groupedServices = [];
      const rangeMap = new Map();

      // Track which services have been added to prevent duplicates
      const addedServiceIds = new Set();

      data.forEach((service) => {
        // Skip if we've already processed this service ID
        if (addedServiceIds.has(service.id)) {
          console.log(
            `Skipping duplicate service ID: ${service.id}, Name: ${service.name}`
          );
          return;
        }

        addedServiceIds.add(service.id);

        const rangeKey = `${service.minOdometer}-${service.maxOdometer}`;
        if (!rangeMap.has(rangeKey)) {
          const rangeGroup = {
            id: rangeKey,
            rangeStart: service.minOdometer,
            rangeEnd: service.maxOdometer,
            services: [],
          };
          rangeMap.set(rangeKey, groupedServices.length);
          groupedServices.push(rangeGroup);
        }

        const index = rangeMap.get(rangeKey);

        const existingServiceIndex = groupedServices[index].services.findIndex(
          (existingService) =>
            existingService.name.toLowerCase() === service.name.toLowerCase()
        );

        if (existingServiceIndex !== -1) {
          console.log(
            `Duplicate service name detected: ${service.name} in range ${rangeKey}`
          );
          if (
            groupedServices[index].services[existingServiceIndex].id >
            service.id
          ) {
            groupedServices[index].services[existingServiceIndex] = {
              id: service.id,
              name: service.name,
              price: service.cost,
            };
            console.log(`Replaced with service ID: ${service.id}`);
          }
        } else {
          // If no duplicate exists, add the service normally
          groupedServices[index].services.push({
            id: service.id,
            name: service.name,
            price: service.cost,
          });
        }
      });

      setServices(groupedServices);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setError("Failed to fetch maintenance services");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Check for duplicates in the loaded data
  useEffect(() => {
    if (!loading && services.length > 0) {
      const hasDuplicates = services.some((range) => {
        const nameMap = new Map();
        for (const service of range.services) {
          const lowerName = service.name.toLowerCase();
          if (nameMap.has(lowerName)) {
            return true;
          }
          nameMap.set(lowerName, true);
        }
        return false;
      });

      setDuplicatesFound(hasDuplicates);

      if (hasDuplicates) {
        console.warn("Duplicate service names detected in the database");
      }
    }
  }, [services, loading]);

  // Update the showToast function to ensure visibility
  const showToast = (type, message) => {
    console.log(`SHOWING TOAST: ${type} - ${message}`); // Debug line

    // Simple toast without custom styling to ensure they appear
    if (type === "success") {
      return toast.success(message, { duration: 5000 });
    } else if (type === "error") {
      return toast.error(message, { duration: 5000 });
    } else if (type === "info") {
      return toast.info(message, { duration: 5000 });
    } else if (type === "loading") {
      return toast.loading(message, { duration: 10000 });
    }
  };

  // Update the cleanupDuplicateServices function to handle all duplicates with the same name
  const cleanupDuplicateServices = async () => {
    try {
      // Group services by name within each range
      const duplicatesByName = new Map();

      // First, identify all duplicates
      services.forEach((range) => {
        const nameMap = new Map();

        range.services.forEach((service) => {
          const nameLower = service.name.toLowerCase();

          if (!nameMap.has(nameLower)) {
            nameMap.set(nameLower, {
              keepId: service.id,
              name: service.name,
              duplicateIds: [],
            });
          } else {
            // If we already have a service with this name, add this one as a duplicate
            const existingService = nameMap.get(nameLower);
            // Keep the one with the lower ID
            if (service.id < existingService.keepId) {
              existingService.duplicateIds.push(existingService.keepId);
              existingService.keepId = service.id;
            } else {
              existingService.duplicateIds.push(service.id);
            }
          }
        });

        // Add duplicates to the global map
        nameMap.forEach((value, name) => {
          if (value.duplicateIds.length > 0) {
            duplicatesByName.set(name, value);
          }
        });
      });

      if (duplicatesByName.size === 0) {
        toast.info("No duplicate services found to clean up");
        return;
      }

      // Total number of duplicates
      const totalDuplicates = Array.from(duplicatesByName.values()).reduce(
        (total, item) => total + item.duplicateIds.length,
        0
      );

      // Ask for confirmation with specific message
      const confirmMessage =
        `Found ${totalDuplicates} duplicate services across ${duplicatesByName.size} service types:\n` +
        Array.from(duplicatesByName.values())
          .map(
            (data) =>
              `- "${data.name}" (${data.duplicateIds.length} duplicates)`
          )
          .join("\n") +
        "\n\nDo you want to delete all duplicates?";

      if (!confirm(confirmMessage)) {
        return;
      }

      // Delete the duplicates
      const loadingId = toast.loading(
        `Deleting ${totalDuplicates} duplicate services...`
      );

      let deletedCount = 0;
      let failedCount = 0;
      let inUseCount = 0;

      for (const [, data] of duplicatesByName.entries()) {
        console.log(`Processing duplicates for service: ${data.name}`);
        console.log(
          `Keeping ID: ${data.keepId}, Removing IDs: ${data.duplicateIds.join(
            ", "
          )}`
        );

        for (const id of data.duplicateIds) {
          try {
            await instance.delete(`/maintenance-services/${id}`);
            deletedCount++;
            console.log(`Successfully deleted duplicate service ID: ${id}`);
          } catch (err) {
            console.error(`Failed to delete service ${id}:`, err);

            if (
              err.response?.status === 400 &&
              err.response.data?.hasReferences === true
            ) {
              inUseCount++;
              console.log(`Service ${id} is in use and cannot be deleted`);
            } else {
              failedCount++;
              console.log(
                `Failed to delete service ${id} due to error:`,
                err.message
              );
            }
          }
        }
      }

      toast.dismiss(loadingId);

      if (deletedCount > 0) {
        toast.success(
          `Successfully deleted ${deletedCount} duplicate services`
        );
      }

      if (inUseCount > 0) {
        toast.error(
          `${inUseCount} services could not be deleted because they are in use`
        );
      }

      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} services due to errors`);
      }

      // Refresh the list after cleaning up
      await fetchServices();
    } catch (err) {
      console.error("Error cleaning up duplicates:", err);
      toast.error("An error occurred while cleaning up duplicates");
    }
  };

  // Reset form when modal closes or editing service changes
  useEffect(() => {
    if (!showAddModal) {
      form.reset();
      setServiceItems([{ name: "", price: 0 }]);
    }
  }, [showAddModal, form]);

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { name: "", price: 0 }]);
  };

  const removeServiceItem = (index) => {
    const updatedItems = [...serviceItems];
    updatedItems.splice(index, 1);
    setServiceItems(updatedItems);
  };

  const validateServiceItem = (item) => {
    const errors = [];
    if (!item.name.trim()) errors.push("Service name is required");
    if (item.price <= 0) errors.push("Price must be greater than 0");
    if (
      serviceItems.filter(
        (s) => s.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      ).length > 1
    ) {
      errors.push("Service name must be unique");
    }
    return errors;
  };

  const handleServiceItemChange = (index, field, value) => {
    const updatedItems = [...serviceItems];
    updatedItems[index][field] =
      field === "price" ? parseFloat(value) || 0 : value;
    setServiceItems(updatedItems);
  };

  const handleEdit = (service) => {
    const servicesWithIds = service.services.map((s) => ({
      ...s,
      originalId: s.id,
    }));

    setEditingService({
      ...service,
      services: servicesWithIds,
    });

    form.setValue("rangeStart", service.rangeStart);
    form.setValue("rangeEnd", service.rangeEnd);
    setServiceItems(
      service.services.map((s) => ({
        name: s.name,
        price: s.price,
        id: s.id,
      }))
    );
    setShowAddModal(true);
  };

  const onSubmit = async (data) => {
    try {
      console.log("Form submitted with data:", data);
      console.log("Service items:", serviceItems);

      const startRange = parseInt(data.rangeStart);
      const endRange = parseInt(data.rangeEnd);

      if (startRange > endRange) {
        toast.error("Start range cannot be greater than end range");
        return;
      }

      if (services.length === 0) {
        console.log("No existing services - no overlaps possible");
      }

      const DISABLE_OVERLAP_CHECK = true;

      if (DISABLE_OVERLAP_CHECK) {
        //
      } else {
        let simpleOverlapFound = false;
        let overlapService = null;

        for (const s of services) {
          if (editingService && s.id === editingService.id) {
            continue;
          }

          const newStart = parseInt(startRange);
          const newEnd = parseInt(endRange);
          const existingStart = parseInt(s.rangeStart);
          const existingEnd = parseInt(s.rangeEnd);

          const condition1 =
            newStart >= existingStart && newStart <= existingEnd;
          const condition2 = newEnd >= existingStart && newEnd <= existingEnd;
          const condition3 = newStart <= existingStart && newEnd >= existingEnd;

          const hasOverlap = condition1 || condition2 || condition3;

          if (hasOverlap) {
            console.log(
              `OVERLAP FOUND with range ${existingStart}-${existingEnd}`
            );
            simpleOverlapFound = true;
            overlapService = s;
            break;
          }
        }

        if (simpleOverlapFound && overlapService) {
          console.log("Overlap detected - stopping submission");
          toast.error(
            `Range overlaps with existing range: ${parseInt(
              overlapService.rangeStart
            ).toLocaleString()} - ${parseInt(
              overlapService.rangeEnd
            ).toLocaleString()} km`,
            { duration: 5000 }
          );
          return;
        }
      }

      console.log("Proceeding with service validation");

      if (serviceItems.some((item) => validateServiceItem(item).length > 0)) {
        console.log(
          "Service items have validation errors, aborting submission"
        );

        const serviceWithErrors = serviceItems.find(
          (item) => validateServiceItem(item).length > 0
        );
        const validationErrors = validateServiceItem(serviceWithErrors);

        toast.error(
          `Service validation failed: ${validationErrors.join(", ")}`,
          { duration: 5000 }
        );
        return;
      }

      toast.loading("Saving services...", { id: "save-service" });

      const savePromises = serviceItems.map(async (item, index) => {
        const name = item.name.trim();
        const price = parseFloat(item.price) || 0;

        if (!name || price <= 0) {
          console.error(`Invalid service data for item ${index}`, item);
          throw new Error(
            `Service ${index + 1} has invalid data: ${
              !name ? "Missing name" : "Invalid price"
            }`
          );
        }

        const serviceData = {
          ServiceName: name,
          ServiceCost: price,
          MinimumOdometer: parseInt(data.rangeStart) || 0,
          MaximumOdometer: parseInt(data.rangeEnd) || 0,
        };

        console.log(`Preparing service ${index + 1}:`, serviceData);

        if (editingService) {
          if (
            editingService.services[index] &&
            editingService.services[index].originalId
          ) {
            console.log(
              `Updating service with ID: ${editingService.services[index].originalId}`
            );
            return instance.put(
              `/maintenance-services/${editingService.services[index].originalId}`,
              serviceData
            );
          } else if (item.id) {
            console.log(`Updating service with ID: ${item.id}`);
            return instance.put(
              `/maintenance-services/${item.id}`,
              serviceData
            );
          } else {
            console.log("Creating new service within existing range");
            return instance.post("/maintenance-services", serviceData);
          }
        } else {
          console.log("Creating brand new service");
          return instance.post("/maintenance-services", serviceData);
        }
      });

      try {
        const results = await Promise.all(savePromises);
        console.log("All services saved successfully:", results);

        toast.dismiss("save-service");
        toast.success(
          editingService
            ? "Services updated successfully!"
            : "Services created successfully!"
        );

        console.log("Closing dialog and resetting form");
        setShowAddModal(false);
        setEditingService(null);
        setServiceItems([{ name: "", price: 0 }]);
        form.reset();

        setTimeout(() => {
          fetchServices();
        }, 300);
      } catch (saveError) {
        console.error("Error in Promise.all:", saveError);
        console.log("Error response:", saveError.response?.data);

        toast.dismiss("save-service");
        toast.error(
          `Failed to save service range: ${
            saveError.response?.data?.message || saveError.data
          }`
        );
      }
    } catch (err) {
      console.error("Failed to save service:", err);
      toast.dismiss("save-service");
      toast.error("Failed to save service range. Please try again.");
    }
  };

  // Add a function to delete an individual service within a range
  const deleteIndividualService = async (rangeId, serviceId, serviceName) => {
    try {
      // First, find all duplicate services with the same name in the same range
      console.log(
        `Looking for duplicates of "${serviceName}" (ID: ${serviceId})`
      );

      const targetRange = services.find((range) => range.id === rangeId);
      if (!targetRange) {
        console.error(`Range ${rangeId} not found`);
        toast.error(`Couldn't find the service range. Please try again.`);
        return;
      }

      // Find all services with the same name (case insensitive) in this range
      const servicesToDelete = targetRange.services.filter(
        (service) => service.name.toLowerCase() === serviceName.toLowerCase()
      );

      console.log(
        `Found ${servicesToDelete.length} services named "${serviceName}"`
      );

      if (servicesToDelete.length === 0) {
        toast.error(`Service "${serviceName}" not found`);
        return;
      }

      // Start the deletion process
      const loadingId = toast.loading(
        servicesToDelete.length > 1
          ? `Deleting ${servicesToDelete.length} instances of "${serviceName}"...`
          : `Deleting service "${serviceName}"...`,
        { duration: 10000 }
      );

      let successCount = 0;
      let errorCount = 0;
      let referencedServiceNames = [];

      // Delete each instance
      for (const service of servicesToDelete) {
        try {
          console.log(`Deleting service "${service.name}" (ID: ${service.id})`);
          await instance.delete(`/maintenance-services/${service.id}`);
          successCount++;
          console.log(`Successfully deleted service ID: ${service.id}`);
        } catch (error) {
          errorCount++;
          console.error(`Failed to delete service ${service.id}:`, error);

          // Check if service is in use
          if (
            error.response?.status === 400 &&
            error.response.data?.hasReferences === true
          ) {
            referencedServiceNames.push(service.name);

            setServiceErrors((prev) => ({
              ...prev,
              [rangeId]: {
                message:
                  error.response.data?.message ||
                  "Cannot delete this service because it is associated with maintenance requests.",
                detail:
                  error.response.data?.detail ||
                  "You must delete the associated maintenance requests first or remove this service from them.",
                referencedServices: [
                  ...(prev[rangeId]?.referencedServices || []),
                  service.name,
                ],
              },
            }));
          }
        }
      }

      toast.dismiss(loadingId);

      if (successCount === servicesToDelete.length) {
        toast.success(
          servicesToDelete.length > 1
            ? `Successfully deleted all ${successCount} instances of "${serviceName}"`
            : `Service "${serviceName}" deleted successfully!`
        );

        // Clear any errors if all services deleted successfully
        setServiceErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[rangeId];
          return newErrors;
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(
          `Deleted ${successCount} of ${servicesToDelete.length} services named "${serviceName}"`
        );
      }

      // Refresh the services list
      console.log("Refreshing services after bulk deletion");
      await fetchServices();
    } catch (err) {
      console.error("Error in delete operation:", err);
      toast.error(`An error occurred while deleting ${serviceName}`);
    }
  };

  // Update the handleDelete function
  const handleDelete = async (serviceId) => {
    const serviceGroup = services.find((s) => s.id === serviceId);
    if (!serviceGroup) {
      showToast("error", "Service range not found.");
      return;
    }

    let successCount = 0;
    let failedServices = [];
    let referencedServices = [];

    try {
      const loadingId = toast.loading("Deleting services...");
      console.log("Loading toast ID:", loadingId); // Debug line

      for (const service of serviceGroup.services) {
        try {
          await instance.delete(`/maintenance-services/${service.id}`);
          successCount++;
        } catch (error) {
          console.error(`Error deleting service ${service.id}:`, error);
          console.log("Error response:", error.response); // Debug line

          if (
            error.response?.status === 400 &&
            error.response.data?.hasReferences === true
          ) {
            referencedServices.push({
              id: service.id,
              name: service.name,
              message:
                error.response.data?.detail ||
                "Referenced by maintenance requests",
            });
            setServiceErrors((prev) => ({
              ...prev,
              [serviceId]: {
                message:
                  error.response.data?.message ||
                  "Cannot delete this service because it is associated with maintenance requests.",
                detail:
                  error.response.data?.detail ||
                  "You must delete the associated maintenance requests first or remove this service from them.",
                referencedServices: [
                  ...(prev[serviceId]?.referencedServices || []),
                  service.name,
                ],
              },
            }));
          } else if (
            error.response?.status === 500 &&
            (error.response.data?.hasReferences === true ||
              error.response.data?.message?.includes("constraint") ||
              JSON.stringify(error.response).includes("constraint") ||
              JSON.stringify(error.response).includes("reference"))
          ) {
            referencedServices.push({
              id: service.id,
              name: service.name,
              message:
                error.response.data?.detail || "Referenced by other records",
            });

            setServiceErrors((prev) => ({
              ...prev,
              [serviceId]: {
                message: "Service is currently in use and can't be removed.",
                detail:
                  error.response.data?.detail || "Referenced by other records",
                referencedServices: [
                  ...(prev[serviceId]?.referencedServices || []),
                  service.name,
                ],
              },
            }));
          } else {
            failedServices.push({
              id: service.id,
              name: service.name,
              status: error.response?.status,
              message: error.response?.data?.message || "Unknown error",
            });
          }
        }
      }

      // Dismiss the loading toast
      toast.dismiss(loadingId);

      // Show appropriate feedback based on results
      if (successCount === serviceGroup.services.length) {
        // All services were deleted successfully
        showToast("success", `Service range deleted successfully!`);
        // Clear any errors for this service
        setServiceErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[serviceId];
          return newErrors;
        });
      } else if (successCount > 0) {
        // Some services were deleted
        showToast(
          "success",
          `Deleted ${successCount} of ${serviceGroup.services.length} services.`
        );
      }

      // Refresh the services list
      await fetchServices();
    } catch (err) {
      toast.dismiss("delete-service");
      console.error("Error in delete operation:", err);
      showToast("error", "An unexpected error occurred. Please try again.");
    }
  };

  const dismissError = (serviceId) => {
    setServiceErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[serviceId];
      return newErrors;
    });
  };

  const handleOpenChange = (open) => {
    if (open === false && form.formState.isSubmitting) {
      console.log("Preventing dialog close during submission");
      return;
    }

    setShowAddModal(open);
    if (!open) {
      setEditingService(null);
      setServiceItems([{ name: "", price: 0 }]);
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">
            Manage maintenance services and their odometer ranges
          </p>
        </div>
        <div className="flex gap-2">
          {duplicatesFound && (
            <Button
              variant="outline"
              onClick={cleanupDuplicateServices}
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              Clean Up Duplicates
            </Button>
          )}
          <Dialog open={showAddModal} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingService(null);
                  setServiceItems([{ name: "", price: 0 }]);
                  form.reset();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Service Range
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Edit Service Range" : "Add Service Range"}
                </DialogTitle>
                <DialogDescription>
                  Define a range of odometer readings and associated services
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rangeStart"
                      rules={{
                        required: "Start range is required",
                        min: {
                          value: 0,
                          message: "Start range must be positive",
                        },
                        validate: {
                          isNumber: (value) =>
                            !isNaN(value) || "Must be a valid number",
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Range (km)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              placeholder="e.g. 10000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rangeEnd"
                      rules={{
                        required: "End range is required",
                        min: {
                          value: 0,
                          message: "End range must be positive",
                        },
                        validate: {
                          isNumber: (value) =>
                            !isNaN(value) || "Must be a valid number",
                          greaterThanStart: (value) => {
                            const start = form.getValues("rangeStart");
                            return (
                              parseInt(value) > parseInt(start) ||
                              "End range must be greater than start range"
                            );
                          },
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Range (km)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              placeholder="e.g. 20000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="font-medium">Services</h4>
                        <p className="text-sm text-muted-foreground">
                          Add maintenance services for this range
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addServiceItem}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service
                      </Button>
                    </div>

                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-4">
                        {serviceItems.map((item, index) => {
                          const errors = validateServiceItem(item);
                          return (
                            <div
                              key={index}
                              className={cn(
                                "rounded-lg border p-4 transition-all",
                                errors.length > 0 &&
                                  "border-destructive/50 bg-destructive/5"
                              )}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-base">
                                    Service {index + 1}
                                  </Label>
                                  {serviceItems.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeServiceItem(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`service-name-${index}`}>
                                      Name
                                    </Label>
                                    <Input
                                      id={`service-name-${index}`}
                                      placeholder="e.g. Oil Change"
                                      value={item.name}
                                      onChange={(e) =>
                                        handleServiceItemChange(
                                          index,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`service-price-${index}`}>
                                      Price (EGP)
                                    </Label>
                                    <Input
                                      id={`service-price-${index}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="e.g. 1000 EGP"
                                      value={item.price}
                                      onChange={(e) =>
                                        handleServiceItemChange(
                                          index,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                {errors.length > 0 && (
                                  <div className="mt-2 text-sm text-destructive">
                                    {errors.map((error, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2"
                                      >
                                        <span>•</span>
                                        <span>{error}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div>
                        {serviceItems.length} service
                        {serviceItems.length !== 1 ? "s" : ""} added
                      </div>
                      <div>
                        {serviceItems.some(
                          (item) => validateServiceItem(item).length > 0
                        ) ? (
                          <Badge variant="destructive">Has errors</Badge>
                        ) : (
                          <Badge variant="outline">Valid</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={() => {
                        console.log("Add button clicked - direct submission");
                        console.log("Form state:", form.getValues());
                        console.log("Form errors:", form.formState.errors);
                        console.log("Service items:", serviceItems);

                        // Force direct submission when clicking the button
                        if (!form.formState.isSubmitting && !loading) {
                          const formData = form.getValues();
                          onSubmit(formData);
                        }
                      }}
                      disabled={
                        loading ||
                        form.formState.isSubmitting ||
                        serviceItems.some(
                          (item) => validateServiceItem(item).length > 0
                        )
                      }
                    >
                      {(loading || form.formState.isSubmitting) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingService ? "Update Services" : "Add Services"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive">{error}</div>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <div key={service.id} className="space-y-3">
              {serviceErrors[service.id] && (
                <Alert variant="destructive" className="relative">
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex-1">
                    <AlertTitle>{serviceErrors[service.id].message}</AlertTitle>
                    {/* <AlertDescription>
                      {serviceErrors[service.id].referencedServices &&
                        serviceErrors[service.id].referencedServices.length >
                          0 && (
                          <div className="mt-2">
                            <p className="font-semibold">Affected services:</p>
                            <ul className="list-disc list-inside">
                              {serviceErrors[service.id].referencedServices.map(
                                (name, index) => (
                                  <li key={index}>{name}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </AlertDescription> */}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1"
                    onClick={() => dismissError(service.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      {service.rangeStart.toLocaleString()} -{" "}
                      {service.rangeEnd.toLocaleString()} km
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Service Range
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this service
                              range? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(service.id)}
                              className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {service.services.length} service
                    {service.services.length !== 1 ? "s" : ""} in this range
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {service.services.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {item.price.toLocaleString()} EGP
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Service
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the service "
                                  {item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteIndividualService(
                                      service.id,
                                      item.id,
                                      item.name
                                    )
                                  }
                                  className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
