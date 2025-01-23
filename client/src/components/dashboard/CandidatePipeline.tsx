import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CandidateProfileModal } from "./recruiter/CandidateProfileModal";
import { FilterBar, type FilterState } from "./recruiter/FilterBar";

interface Candidate {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  lastActivity: string;
  nextSteps: string | null;
  notes: string | null;
}

interface PipelineStage {
  id: string;
  title: string;
  candidates: Candidate[];
}

const PIPELINE_STAGES = [
  { id: "new", title: "New Referral", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100/50" },
  { id: "interviewing", title: "Interviewing", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/50" },
  { id: "hired", title: "Hired", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100/50" },
  { id: "rejected", title: "Rejected", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50" },
];

export function CandidatePipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    department: "all",
    dateRange: {
      from: undefined,
      to: undefined,
    },
    sortBy: "lastActivity",
    sortDirection: "desc",
  });

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: [
      "/api/recruiter/pipeline",
      filters.role,
      filters.department,
      filters.dateRange.from?.toISOString(),
      filters.dateRange.to?.toISOString(),
      filters.sortBy,
      filters.sortDirection,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role !== "all") params.append("role", filters.role);
      if (filters.department !== "all") params.append("department", filters.department);
      if (filters.dateRange.from) params.append("fromDate", filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.append("toDate", filters.dateRange.to.toISOString());
      params.append("sortBy", filters.sortBy);
      params.append("sortDirection", filters.sortDirection);

      const response = await fetch(`/api/recruiter/pipeline?${params}`);
      if (!response.ok) throw new Error("Failed to fetch pipeline data");
      return response.json();
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ candidateId, newStage }: { candidateId: number; newStage: string }) => {
      const response = await fetch("/api/recruiter/pipeline/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, newStage }),
      });
      if (!response.ok) throw new Error("Failed to update candidate stage");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/pipeline"] });
      toast({
        title: "Success",
        description: "Candidate stage updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update candidate stage",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      await updateStageMutation.mutateAsync({
        candidateId: parseInt(draggableId),
        newStage: destination.droppableId,
      });
    } catch (error) {
      console.error("Error updating candidate stage:", error);
    }
  };

  const handleCandidateClick = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setIsModalOpen(true);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <FilterBar onFilterChange={handleFilterChange} isLoading={true} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{stage.title}</h3>
                <Skeleton className="h-6 w-8" />
              </div>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <FilterBar onFilterChange={handleFilterChange} isLoading={isLoading} />
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PIPELINE_STAGES.map((stage) => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-gray-900">{stage.title}</h3>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {pipelineData?.pipeline?.[stage.id]?.count || 0}
                      </Badge>
                    </div>
                    <div
                      className={`flex-1 rounded-lg p-3 space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? "bg-gray-100/80" : "bg-gray-50"
                      }`}
                    >
                      {pipelineData?.pipeline?.[stage.id]?.candidates?.map((candidate: Candidate, index: number) => (
                        <Draggable
                          key={candidate.id}
                          draggableId={candidate.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-all border shadow-sm hover:shadow-md cursor-pointer ${stage.color}`}
                              onClick={() => handleCandidateClick(candidate.id)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start space-x-3">
                                  <Avatar className="h-8 w-8 border-2 border-white bg-gray-100">
                                    <span className="font-semibold text-xs">
                                      {candidate.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </span>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm truncate">
                                      {candidate.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {candidate.role}
                                    </p>
                                  </div>
                                </div>
                                {candidate.department && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {candidate.department}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>Last activity:</span>
                                  <span>{format(new Date(candidate.lastActivity), "MMM d")}</span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <CandidateProfileModal
        candidateId={selectedCandidateId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userRole="recruiter"
      />
    </>
  );
}