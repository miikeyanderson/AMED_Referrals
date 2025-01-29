
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Building2, Share2, Heart } from "lucide-react";

export default function JobsPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job Opportunities</h1>
      
      <div className="flex gap-4 mb-6">
        <Input 
          type="search" 
          placeholder="Search jobs..." 
          className="max-w-xs bg-background"
        />
        <Select defaultValue="all-specialties">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-specialties">All Specialties</SelectItem>
            <SelectItem value="nursing">Nursing</SelectItem>
            <SelectItem value="physician">Physician</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-locations">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-locations">All Locations</SelectItem>
            <SelectItem value="ca">California</SelectItem>
            <SelectItem value="tx">Texas</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-types">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-types">All Types</SelectItem>
            <SelectItem value="full-time">Full Time</SelectItem>
            <SelectItem value="part-time">Part Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isLoading && jobs?.jobs?.map((job: any) => (
          <div key={job.id} className="p-6 rounded-lg border bg-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">{job.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {job.location.city}, {job.location.state}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">${job.basePay.toLocaleString()}/year</div>
                {job.bonusAmount > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-sm font-medium">${job.bonusAmount.toLocaleString()} Bonus</div>
                    <div className="text-xs text-muted-foreground">{job.bonusDetails}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {job.specialty}
                </div>
                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {job.type}
                </div>
                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {job.shift} shift
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Apply
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
