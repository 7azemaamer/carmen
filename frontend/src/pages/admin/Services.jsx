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
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceItems, setServiceItems] = useState([{ name: "", price: 0 }]);
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

      data.forEach((service) => {
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
        groupedServices[index].services.push({
          id: service.id,
          name: service.name,
          price: service.cost,
        });
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

      // Simple range overlap check for debugging
      console.log("Checking for overlaps with simple logic");
      console.log(`Total services to check: ${services.length}`);

      // If there are no services, we can't have any overlaps
      if (services.length === 0) {
        console.log("No existing services - no overlaps possible");
      }

      // Temporarily disable overlap detection for debugging
      const DISABLE_OVERLAP_CHECK = true;

      if (DISABLE_OVERLAP_CHECK) {
        console.log(
          "⚠️ OVERLAP DETECTION DISABLED - proceeding with submission"
        );
      } else {
        let simpleOverlapFound = false;
        let overlapService = null;

        for (const s of services) {
          // Skip comparing with the service being edited
          if (editingService && s.id === editingService.id) {
            console.log(`Skipping edited service: ${s.id}`);
            continue;
          }

          // Parse range values as integers
          const newStart = parseInt(startRange);
          const newEnd = parseInt(endRange);
          const existingStart = parseInt(s.rangeStart);
          const existingEnd = parseInt(s.rangeEnd);

          console.log(
            `Comparing: new(${newStart}-${newEnd}) vs existing(${existingStart}-${existingEnd})`
          );

          // Check for overlap - implementation from scratch
          const condition1 =
            newStart >= existingStart && newStart <= existingEnd;
          const condition2 = newEnd >= existingStart && newEnd <= existingEnd;
          const condition3 = newStart <= existingStart && newEnd >= existingEnd;

          console.log(`   Condition 1 (start in range): ${condition1}`);
          console.log(`   Condition 2 (end in range): ${condition2}`);
          console.log(`   Condition 3 (surrounds existing): ${condition3}`);

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

        // Get the validation errors for each service
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

      // Add loading toast
      toast.loading("Saving services...", { id: "save-service" });

      console.log("Preparing to save services");
      const savePromises = serviceItems.map(async (item, index) => {
        // Ensure values are properly validated and formatted
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

        // Fetch updated services after a short delay
        setTimeout(() => {
          fetchServices();
        }, 300);
      } catch (saveError) {
        console.error("Error in Promise.all:", saveError);
        console.log("Error response:", saveError.response?.data);

        toast.dismiss("save-service");
        toast.error(
          `Failed to save service range: ${
            saveError.response?.data?.message || saveError.message
          }`
        );
      }
    } catch (err) {
      console.error("Failed to save service:", err);
      toast.dismiss("save-service");
      toast.error("Failed to save service range. Please try again.");
    }
  };

  const handleDelete = async (serviceId) => {
    const serviceGroup = services.find((s) => s.id === serviceId);
    if (!serviceGroup) {
      toast.error("Service range not found.");
      return;
    }

    let successCount = 0;
    let failedServices = [];
    let referencedServices = [];

    try {
      toast.loading("Deleting services...", { id: "delete-service" });

      for (const service of serviceGroup.services) {
        try {
          console.log(`Attempting to delete service ${service.id}`);
          await instance.delete(`/maintenance-services/${service.id}`);
          successCount++;
        } catch (error) {
          console.error(`Error deleting service ${service.id}:`, error);

          if (error.response) {
            console.log(
              "Error Response:",
              error.response.status,
              JSON.stringify(error.response.data)
            );
          }

          if (error.response) {
            if (
              error.response.status === 400 &&
              (error.response.data?.message?.includes(
                "associated with maintenance"
              ) ||
                error.response.data?.hasReferences === true)
            ) {
              referencedServices.push({
                id: service.id,
                name: service.name,
                message:
                  error.response.data?.detail ||
                  "Referenced by maintenance requests",
              });
            } else if (
              error.response.status === 500 &&
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

              toast.error(
                `🔒 Service "${service.name}" is currently in use! It's part of active maintenance requests and can't be removed. Think of it as a VIP - Very Important Part of your maintenance history!`,
                {
                  duration: 6000,
                  icon: "🛠️",
                }
              );
            } else {
              failedServices.push({
                id: service.id,
                name: service.name,
                status: error.response.status,
                message: error.response.data?.message || "Unknown error",
              });
            }
          } else {
            // Network or other errors
            failedServices.push({
              id: service.id,
              name: service.name,
              message: error.message || "Network error",
            });
          }
        }
      }

      // Dismiss the loading toast
      toast.dismiss("delete-service");

      // Show appropriate feedback based on results
      if (successCount === serviceGroup.services.length) {
        // All services were deleted successfully
        toast.success(
          `🎉 Service range deleted successfully! Your maintenance list just got a little lighter.`
        );
      } else if (successCount > 0) {
        // Some services were deleted
        toast.success(
          `✨ Spring cleaning in progress! Deleted ${successCount} of ${serviceGroup.services.length} services.`,
          { duration: 5000 }
        );
      }

      // Show error messages for services that couldn't be deleted
      if (referencedServices.length > 0) {
        if (referencedServices.length === 1) {
          // We already showed individual messages for constraint violations
        } else if (referencedServices.length > 1) {
          toast.error(
            `🔗 ${referencedServices.length} services are still being used in maintenance requests. They're too important to delete right now!`,
            { duration: 6000 }
          );
        }
      }

      if (failedServices.length > 0) {
        toast.error(
          `⚠️ Oops! We couldn't delete ${failedServices.length} service(s). Technical gremlins might be at work.`,
          { duration: 5000 }
        );
      }

      // Refresh the services list
      await fetchServices();
    } catch (err) {
      toast.dismiss("delete-service");
      console.error("Error in delete operation:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleOpenChange = (open) => {
    // Only close the dialog if we're explicitly closing it (not during validation)
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive">{error}</div>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <Card key={service.id}>
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
                            Are you sure you want to delete this service range?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(service.id)}
                            className="bg-destructive text-white text-destructive-foreground hover:bg-destructive/90"
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
                      <span className="text-muted-foreground">
                        {item.price.toLocaleString()} EGP
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
