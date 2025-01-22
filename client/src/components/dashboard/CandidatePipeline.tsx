import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  
  // Fetch pipeline data
  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["/api/recruiter/pipeline"],
    queryFn: async () => {
      const response = await fetch("/api/recruiter/pipeline");
      if (!response.ok) throw new Error("Failed to fetch pipeline data");
      return response.json();
    },
  });

  // Update candidate stage mutation
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

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update the candidate's stage
    try {
      await updateStageMutation.mutateAsync({
        candidateId: parseInt(draggableId),
        newStage: destination.droppableId,
      });
    } catch (error) {
      console.error("Error updating candidate stage:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-4">
        {PIPELINE_STAGES.map((stage) => (
          <Droppable key={stage.id} droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4"
              >
                <h3 className="font-medium text-sm flex items-center justify-between">
                  {stage.title}
                  <span className="text-xs text-muted-foreground">
                    {pipelineData?.pipeline?.[stage.id]?.count || 0}
                  </span>
                </h3>
                <div
                  className={`min-h-[500px] rounded-lg p-4 space-y-4 transition-colors ${
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
                          className="bg-card hover:bg-accent transition-colors"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <span className="font-semibold text-xs">
                                    {candidate.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {candidate.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {candidate.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {candidate.department && (
                              <p className="text-xs text-muted-foreground">
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
  );
}
