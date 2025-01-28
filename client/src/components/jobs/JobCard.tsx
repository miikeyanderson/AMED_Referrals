import { Job } from "@db/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Gift, Share2, Mail, Linkedin } from "lucide-react";
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
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-primary">{job.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {location.city}, {location.state}
              </span>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                    className="h-8 w-8"
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
                    className="h-8 w-8"
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
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-medium">
              ${Number(job.basePay).toLocaleString()}/year
            </span>
          </div>
          {job.bonusAmount && (
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              <div>
                <span className="font-medium text-purple-600">
                  ${Number(job.bonusAmount).toLocaleString()} Bonus
                </span>
                {job.bonusDetails && (
                  <p className="text-sm text-muted-foreground">{job.bonusDetails}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 py-3">
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
            {job.specialty}
          </span>
          <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-sm">
            {job.type}
          </span>
          {job.shift && (
            <span className="bg-accent/10 text-accent px-2 py-1 rounded-md text-sm">
              {job.shift} shift
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}