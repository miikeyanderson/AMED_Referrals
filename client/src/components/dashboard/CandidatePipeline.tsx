import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CandidateProfileModal } from "./recruiter/CandidateProfileModal";

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
  { id: "new", title: "New Referral" },
  { id: "contacted", title: "Contacted" },
  { id: "interviewing", title: "Interviewing" },
  { id: "hired", title: "Hired" },
  { id: "rejected", title: "Rejected" },
];

export function CandidatePipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["/api/recruiter/pipeline"],
    queryFn: async () => {
      const response = await fetch("/api/recruiter/pipeline");
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

  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-w-0">
          {PIPELINE_STAGES.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-w-0"
                >
                  <h3 className="font-medium text-sm flex items-center justify-between">
                    {stage.title}
                    <span className="text-xs text-muted-foreground">
                      {pipelineData?.pipeline?.[stage.id]?.count || 0}
                    </span>
                  </h3>
                  <div
                    className={`min-h-[500px] max-h-[calc(100vh-12rem)] overflow-y-auto rounded-lg p-4 space-y-4 transition-colors ${
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
                            className="bg-card hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => handleCandidateClick(candidate.id)}
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
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
                                    <p className="text-xs text-muted-foreground truncate">
                                      {candidate.role}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {candidate.department && (
                                <p className="text-xs text-muted-foreground truncate">
                                  Department: {candidate.department}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground">
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

      <CandidateProfileModal
        candidateId={selectedCandidateId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userRole="recruiter" // TODO: Get actual user role from auth context
      />
    </>
  );
}