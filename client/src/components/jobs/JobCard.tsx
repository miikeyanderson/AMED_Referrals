
import { Job } from "@db/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Gift, Mail, Linkedin, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const handleShare = (platform: 'email' | 'sms' | 'linkedin') => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    const title = encodeURIComponent(job.title);
    const text = encodeURIComponent(`Check out this job opportunity: ${job.title}`);

    switch (platform) {
      case 'email':
        window.open(`mailto:?subject=${title}&body=${text}%0A%0A${jobUrl}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${jobUrl}`);
        break;
      case 'sms':
        window.open(`sms:?body=${text}%20${jobUrl}`);
        break;
    }
  };

  const location = job.location as { city: string; state: string; coordinates?: { latitude: number; longitude: number } };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary">{job.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {location.city}, {location.state}
              </span>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-800/50"
                    onClick={() => handleShare('email')}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share via Email</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-800/50"
                    onClick={() => handleShare('linkedin')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share on LinkedIn</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-800/50"
                    onClick={() => handleShare('sms')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share via SMS</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">
              ${Number(job.basePay).toLocaleString()}/year
            </span>
          </div>
          {job.bonusAmount && (
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent-foreground" />
              <div>
                <span className="font-medium text-accent-foreground">
                  ${Number(job.bonusAmount).toLocaleString()} Bonus
                </span>
                {job.bonusDetails && (
                  <p className="text-sm text-muted-foreground mt-0.5">{job.bonusDetails}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-900/50 py-3">
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20">
            {job.specialty}
          </span>
          <span className="bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full text-sm border border-secondary/20">
            {job.type}
          </span>
          {job.shift && (
            <span className="bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm border border-accent/20">
              {job.shift} shift
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
