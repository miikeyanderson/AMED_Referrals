import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  { id: "new", title: "New Referral", color: "bg-blue-900/30 text-blue-100 border-blue-200" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-900/30 text-yellow-100 border-yellow-200" },
  { id: "interviewing", title: "Interviewing", color: "bg-purple-900/30 text-purple-100 border-purple-200" },
  { id: "hired", title: "Hired", color: "bg-green-900/30 text-green-100 border-green-200" },
  { id: "rejected", title: "Rejected", color: "bg-red-900/30 text-red-100 border-red-200" },
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
              <h3 className="font-medium text-sm">{stage.title}</h3>
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
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-2 min-w-0 px-2 md:px-4">
            {PIPELINE_STAGES.map((stage) => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 w-full lg:min-w-[280px] lg:max-w-[300px] flex-shrink-0"
                  >
                    <h3 className={`flex items-center justify-between p-2 rounded-md ${stage.color}`}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{stage.title}</span>
                        <span className="text-sm opacity-70">
                          {pipelineData?.pipeline?.[stage.id]?.count || 0}
                        </span>
                      </div>
                    </h3>
                    <div
                      className={`min-h-[300px] lg:min-h-[500px] max-h-[calc(100vh-12rem)] overflow-y-auto rounded-lg p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-muted/50" : "bg-muted/10"
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
                              className={`transition-colors cursor-pointer border ${PIPELINE_STAGES.find(s => s.id === stage.id)?.color} hover:bg-accent`}
                              onClick={() => handleCandidateClick(candidate.id)}
                            >
                              <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-2.5">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                      <span className="font-semibold text-xs">
                                        {candidate.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")}
                                      </span>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <h4 className="font-medium text-sm truncate">
                                        {candidate.name}
                                      </h4>
                                      <p className="text-xs text-foreground/80 truncate">
                                        {candidate.role}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {candidate.department && (
                                  <p className="text-xs text-foreground/70 truncate">
                                    Department: {candidate.department}
                                  </p>
                                )}
                                <div className="text-xs text-foreground/70">
                                  Last activity:{" "}
                                  {format(new Date(candidate.lastActivity), "MMM d, yyyy")}
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