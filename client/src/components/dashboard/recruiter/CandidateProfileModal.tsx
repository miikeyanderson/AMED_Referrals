import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  FileText,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  Building,
  Tag,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandidateProfileModalProps {
  candidateId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
}

export function CandidateProfileModal({
  candidateId,
  open,
  onOpenChange,
  userRole,
}: CandidateProfileModalProps) {
  const { toast } = useToast();

  const { data: candidate, isLoading, error } = useQuery({
    queryKey: [`/api/candidate/${candidateId}`, candidateId],
    queryFn: async () => {
      if (!candidateId) return null;
      const response = await fetch(`/api/candidate/${candidateId}`);
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view candidate details.",
            variant: "destructive",
          });
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this candidate.",
            variant: "destructive",
          });
          throw new Error("Access denied");
        }
        if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "Candidate information not found.",
            variant: "destructive",
          });
          throw new Error("Candidate not found");
        }
        throw new Error("Failed to fetch candidate data");
      }
      return response.json();
    },
    enabled: !!candidateId && open,
  });

  useEffect(() => {
    if (error) {
      onOpenChange(false);
    }
  }, [error, onOpenChange]);

  const isRecruiter = userRole === "recruiter" || userRole === "leadership";
  const canViewSensitiveInfo = isRecruiter || candidate?.referrerId === candidateId;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Candidate Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : candidate ? (
          <ScrollArea className="h-full pr-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                {isRecruiter && (
                  <>
                    <TabsTrigger value="notes">Notes & History</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{candidate.candidateName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.position}</span>
                    </div>
                    {candidate.department && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>{candidate.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Created: {format(new Date(candidate.createdAt), "PPP")}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Details - Only visible to recruiters or owners */}
                {canViewSensitiveInfo && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Contact Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{candidate.candidateEmail}</span>
                        </div>
                        {candidate.candidatePhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{candidate.candidatePhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Skills and Experience */}
                {candidate.skillTags && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skillTags.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {candidate.socialLinks && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Profiles</h3>
                    <div className="flex gap-4">
                      {Object.entries(candidate.socialLinks).map(
                        ([platform, url]) => (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                          >
                            <Globe className="h-4 w-4" />
                            {platform}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Notes & History Tab - Recruiters Only */}
              {isRecruiter && (
                <TabsContent value="notes" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recruiter Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {candidate.recruiterNotes || "No notes available"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Action History</h3>
                    <div className="space-y-4">
                      {candidate.actionHistory?.map((action: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{action.action}</p>
                            {action.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {action.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(action.timestamp), "PPP p")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Documents Tab - Recruiters Only */}
              {isRecruiter && (
                <TabsContent value="documents" className="space-y-6">
                  {candidate.resumeUrl ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Resume</h3>
                      <div className="flex items-center gap-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>No resume available</span>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            {/* Quick Actions - Recruiters Only */}
            {isRecruiter && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = `mailto:${candidate.candidateEmail}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement scheduling functionality
                      toast({
                        title: "Coming Soon",
                        description: "Interview scheduling will be available soon.",
                      });
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No candidate data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
