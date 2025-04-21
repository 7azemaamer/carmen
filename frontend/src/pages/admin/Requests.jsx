import { useState, useEffect } from "react";
import instance from "@/api/instance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, CarIcon, UserIcon, WrenchIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-700",
  approved: "bg-blue-500/10 text-blue-700",
  in_progress: "bg-purple-500/10 text-purple-700",
  completed: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
};

const STATUS_DISPLAY = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_STATUS_OPTIONS = {
  pending: ["approved", "cancelled"],
  approved: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompletionDate, setSelectedCompletionDate] = useState(null);

  const fetchRequests = async () => {
    try {
      const { data } = await instance.get("/admin/maintenance-requests");

      const groupedRequests = data.reduce((acc, item) => {
        const key = `${item.vehicle.vehicleId}-${item.requestDate}`;
        if (!acc[key]) {
          acc[key] = {
            id: item.requestId,
            status: item.status.toLowerCase(),
            date: item.requestDate,
            completionDate: item.completionDate,
            adminNotes: item.adminNotes,
            vehicleId: item.vehicle.vehicleId,
            vehicleModel: item.vehicle.vehicleType,
            vehiclePlate: item.vehicle.licensePlateNumber,
            userName: item.vehicle.owner,
            reading: item.odometerReading,
            services: [],
          };
        }
        acc[key].services.push({
          name: item.services[0].serviceName,
          price: item.services[0].serviceCost,
          status: item.status.toLowerCase(),
        });
        return acc;
      }, {});

      const mappedRequests = Object.values(groupedRequests);
      const sortedRequests = [...mappedRequests].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setRequests(sortedRequests);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch maintenance requests:", err);
      setError("Failed to fetch maintenance requests");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await instance.put(`/maintenance/admin/${requestId}`, {
        status: newStatus,
      });

      if (newStatus === "completed" && selectedCompletionDate) {
        // Use the same fixed date string approach to ensure consistent date handling
        const date = new Date(selectedCompletionDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();

        // Create fixed date string with noon UTC time to avoid day boundary issues
        const fixedDateString = `${year}-${String(month).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}T12:00:00.000Z`;

        console.log(
          `Completion with status change - User selected: ${date.toLocaleString()}`
        );
        console.log(
          `Completion with status change - Sending fixed date: ${fixedDateString}`
        );

        await instance.put(`/maintenance/admin/completion/${requestId}`, {
          completionDate: fixedDateString,
        });
      }

      // Only save admin notes if they've changed
      const originalNotes = selectedRequest.adminNotes || "";
      if (adminNote !== originalNotes) {
        await instance.put(`/maintenance/admin/note/${requestId}`, {
          adminNotes: adminNote,
        });
      }

      toast.success(
        `Maintenance request ${
          newStatus === "completed" ? "completed" : "status updated"
        } successfully!`
      );

      fetchRequests();
      setShowModal(false);
      setAdminNote("");
      setSelectedCompletionDate(null);
    } catch (err) {
      console.error("Failed to update request status:", err);
      toast.error("Failed to update request status. Please try again.");
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNotes || "");
    setShowModal(true);
  };

  const getTotalCost = (services) => {
    return services.reduce((total, service) => total + service.price, 0);
  };

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((request) => request.status === statusFilter);

  const handleUpdateCompletionDate = async () => {
    try {
      if (!selectedCompletionDate) {
        toast.error("Please select a completion date first");
        return;
      }

      // CRITICAL FIX FOR DATE ISSUE:
      // When user selects April 3rd in Egypt (UTC+2), we need to make sure April 3rd is saved
      // regardless of timezone conversions

      // Get the selected date components in user's local timezone
      const userDate = new Date(selectedCompletionDate);

      // Create a date string in ISO format but force the time to be 12:00 UTC
      // This ensures the same date is preserved when the backend converts to UTC
      // We're setting a fixed time that's safely in the middle of the day
      const year = userDate.getFullYear();
      const month = userDate.getMonth() + 1; // JavaScript months are 0-indexed
      const day = userDate.getDate();

      // If we want "April 3rd" to be saved as "April 3rd" in the database:
      // 1. Create a string with the exact date parts we want preserved
      // 2. Set the time to noon to avoid any day boundary issues with timezone conversion
      // 3. Make sure we use proper UTC notation (Z suffix) to prevent any additional conversions
      const fixedDateString = `${year}-${String(month).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}T12:00:00.000Z`;

      console.log(`User selected: ${userDate.toLocaleString()}`);
      console.log(`Sending fixed date string: ${fixedDateString}`);

      const response = await instance.put(
        `/maintenance/admin/completion/${selectedRequest.id}`,
        {
          completionDate: fixedDateString,
        }
      );

      toast.success("Completion date updated successfully!");
      console.log("Server response:", response.data);
      console.log(`Date saved on server: ${response.data.date}`);

      setSelectedRequest({
        ...selectedRequest,
        completionDate: response.data.date,
      });

      fetchRequests();
    } catch (err) {
      console.error("Failed to update completion date:", err);
      toast.error("Failed to update completion date. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Maintenance Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all vehicle maintenance requests
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">
              No maintenance requests found for the selected filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Reading</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(request.date).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {request.userName || `User ${request.userId}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <CarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{request.vehicleModel}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {request.vehiclePlate}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{request.reading.toLocaleString()} km</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {request.services.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{service.name}</span>
                            <Badge
                              variant="secondary"
                              className={STATUS_COLORS[service.status]}
                            >
                              {STATUS_DISPLAY[service.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[request.status]}>
                        {STATUS_DISPLAY[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleViewDetails(request)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setSelectedCompletionDate(null);
            setAdminNote("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span>Request #{selectedRequest?.id}</span>
              <Badge
                className={
                  selectedRequest ? STATUS_COLORS[selectedRequest.status] : ""
                }
              >
                {selectedRequest ? STATUS_DISPLAY[selectedRequest.status] : ""}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <ScrollArea
              className={cn(
                "h-[calc(90vh-8rem)] overflow-y-auto",
                selectedRequest.status === "completed" && "h-[calc(90vh-12rem)]"
              )}
            >
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        Vehicle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="grid gap-1">
                        <p className="text-sm text-muted-foreground">Model</p>
                        <p className="font-medium">
                          {selectedRequest.vehicleModel}
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm text-muted-foreground">
                          Plate Number
                        </p>
                        <p className="font-medium">
                          {selectedRequest.vehiclePlate}
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm text-muted-foreground">
                          Current Reading
                        </p>
                        <p className="font-medium">
                          {selectedRequest.reading.toLocaleString()} km
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Owner Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="grid gap-1">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {selectedRequest.userName}
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm text-muted-foreground">
                          Request Date
                        </p>
                        <p className="font-medium">
                          {format(new Date(selectedRequest.date), "PPP p")}
                        </p>
                      </div>
                      <div className="grid gap-1">
                        {selectedRequest.status === "in_progress" && (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Completion Date
                            </p>
                          </>
                        )}

                        {selectedRequest.status === "completed" ? (
                          <p className="font-medium">
                            {selectedRequest.completionDate
                              ? format(
                                  new Date(selectedRequest.completionDate),
                                  "PPP p"
                                )
                              : "Not set"}
                          </p>
                        ) : selectedRequest.status !== "in_progress" ? (
                          <></>
                        ) : (
                          <div className="space-y-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedCompletionDate &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedCompletionDate
                                    ? format(selectedCompletionDate, "PPP")
                                    : "Set completion date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedCompletionDate}
                                  onSelect={setSelectedCompletionDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {selectedCompletionDate && (
                              <Button
                                className="w-full"
                                onClick={handleUpdateCompletionDate}
                              >
                                Save Completion Date
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <WrenchIcon className="h-4 w-4" />
                      Requested Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {selectedRequest.services.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-2"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{service.name}</p>
                            <Badge
                              variant="secondary"
                              className={STATUS_COLORS[service.status]}
                            >
                              {STATUS_DISPLAY[service.status]}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold">
                            E£{service.price.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold">Total Cost</p>
                        <p className="text-lg font-semibold">
                          E£
                          {getTotalCost(
                            selectedRequest.services
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add any relevant notes about this maintenance request..."
                      className="min-h-[80px] resize-none"
                    />
                    <Button
                      className="w-full"
                      variant={
                        adminNote !== (selectedRequest.adminNotes || "")
                          ? "default"
                          : "outline"
                      }
                      disabled={
                        adminNote === (selectedRequest.adminNotes || "")
                      }
                      onClick={async () => {
                        try {
                          await instance.put(
                            `/maintenance/admin/note/${selectedRequest.id}`,
                            {
                              adminNotes: adminNote,
                            }
                          );

                          toast.success("Admin notes saved successfully!");

                          // Update the selectedRequest object locally to reflect the new notes
                          setSelectedRequest({
                            ...selectedRequest,
                            adminNotes: adminNote,
                          });

                          // Also update the main data
                          fetchRequests();
                        } catch (err) {
                          console.error("Failed to save admin notes:", err);
                          toast.error(
                            "Failed to save admin notes. Please try again."
                          );
                        }
                      }}
                    >
                      {adminNote !== (selectedRequest.adminNotes || "")
                        ? "Save Notes"
                        : "No Changes"}
                    </Button>
                  </CardContent>
                </Card>

                {NEXT_STATUS_OPTIONS[selectedRequest.status]?.length > 0 && (
                  <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2">
                    {NEXT_STATUS_OPTIONS[selectedRequest.status].map(
                      (status) => {
                        const isCompleteAction = status === "completed";
                        const needsCompletionDate =
                          isCompleteAction && !selectedCompletionDate;

                        return (
                          <Button
                            key={status}
                            onClick={() =>
                              handleStatusChange(selectedRequest.id, status)
                            }
                            variant={
                              status === "cancelled" ? "destructive" : "default"
                            }
                            disabled={needsCompletionDate}
                          >
                            {STATUS_DISPLAY[status]}
                            {needsCompletionDate && " (Set date)"}
                          </Button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRequests;
