import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "../../api/instance";
import { useToastStore } from "../../lib/store";
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
  const { addToast } = useToastStore();
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
      // Validate min/max range
      const startRange = parseInt(data.rangeStart);
      const endRange = parseInt(data.rangeEnd);

      if (startRange > endRange) {
        addToast({
          type: "error",
          message: "Start range cannot be greater than end range",
        });
        return;
      }

      const hasOverlap = services.some((existingService) => {
        const existingStart = existingService.rangeStart;
        const existingEnd = existingService.rangeEnd;

        if (editingService && existingService.id === editingService.id) {
          return false;
        }

        const overlaps =
          (startRange >= existingStart && startRange <= existingEnd) ||
          (endRange >= existingStart && endRange <= existingEnd) ||
          (startRange <= existingStart && endRange >= existingEnd);

        if (overlaps) {
          addToast({
            type: "error",
            message: `Range overlaps with existing range: ${existingStart.toLocaleString()} - ${existingEnd.toLocaleString()} km`,
          });
        }

        return overlaps;
      });

      if (hasOverlap) {
        return;
      }

      if (serviceItems.some((item) => validateServiceItem(item).length > 0)) {
        addToast({
          type: "error",
          message: "All service items must be valid",
        });
        return;
      }

      const savePromises = serviceItems.map(async (item, index) => {
        const serviceData = {
          ServiceName: item.name,
          ServiceCost: item.price,
          MinimumOdometer: parseInt(data.rangeStart),
          MaximumOdometer: parseInt(data.rangeEnd),
        };

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
          return instance.post("/maintenance-services", serviceData);
        }
      });

      await Promise.all(savePromises);

      addToast({
        type: "success",
        message: editingService
          ? "Services updated successfully!"
          : "Services created successfully!",
      });

      setShowAddModal(false);
      setEditingService(null);
      setServiceItems([{ name: "", price: 0 }]);
      form.reset();
      fetchServices();
    } catch (err) {
      console.error("Failed to save service:", err);
      addToast({
        type: "error",
        message: "Failed to save service range. Please try again.",
      });
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      const serviceGroup = services.find((s) => s.id === serviceId);
      let hasErrors = false;

      for (const service of serviceGroup.services) {
        try {
          await instance.delete(`/maintenance-services/${service.id}`);
        } catch (error) {
          hasErrors = true;
          if (
            error.response?.status === 500 &&
            error.response?.data?.includes("REFERENCE constraint")
          ) {
            toast.error(
              `Service "${service.name}" cannot be deleted because it is used in existing maintenance requests.`
            );
          } else {
            toast.error(
              `Failed to delete service "${service.name}". Please try again later.`
            );
          }
        }
      }

      if (!hasErrors) {
        toast.success("Service range deleted successfully!");
      }

      fetchServices();
    } catch (err) {
      console.error("Failed to delete service:", err);
      toast.error("Failed to delete service range. Please try again.");
    }
  };

  const handleOpenChange = (open) => {
    setShowAddModal(open);
    if (!open) {
      // Reset everything when closing
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
                onSubmit={form.handleSubmit(onSubmit)}
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
                    disabled={
                      loading ||
                      serviceItems.some(
                        (item) => validateServiceItem(item).length > 0
                      )
                    }
                  >
                    {loading && (
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
