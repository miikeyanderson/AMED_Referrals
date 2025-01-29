
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

export default function JobDetailPage() {
  const { id } = useParams();
  
  const { data: job, isLoading } = useQuery({
    queryKey: ['/api/jobs', id],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full bg-white p-6 [&_::-webkit-scrollbar]:w-2 [&_::-webkit-scrollbar-thumb]:rounded-full [&_::-webkit-scrollbar-thumb]:bg-gray-200 [&_::-webkit-scrollbar-track]:bg-gray-100">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold">${job?.basePay}/year</div>
          <h1 className="mt-1 text-xl">{job?.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#FF4405] hover:bg-[#FF4405]/90">Apply Now</Button>
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" />
            Favorite
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="w-full justify-start gap-4 border-b bg-transparent p-0">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4405]"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="facility"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4405]"
          >
            Facility
          </TabsTrigger>
          <TabsTrigger
            value="paycheck"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4405]"
          >
            Your paycheck
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="h-[600px] overflow-y-auto pr-2">
            <div className="mt-6 grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="mt-1">{job?.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Specialty</div>
                <div className="mt-1">{job?.specialty}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Department</div>
                <div className="mt-1">{job?.department}</div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium">Facility Details</h2>
              <div className="mt-4">
                <div className="text-sm text-gray-600">Facility name</div>
                <div className="mt-1">{job?.facility}</div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-600">Location</div>
                <div className="mt-1">{job?.location?.city}, {job?.location?.state}</div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium">Job Description</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <p>{job?.description}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium">Requirements</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <p>{job?.requirements}</p>
              </div>
            </div>

            {job?.benefits && (
              <div className="mt-8 mb-6">
                <h2 className="text-lg font-medium">Benefits</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  {job.benefits.map((benefit: string, index: number) => (
                    <p key={index}>• {benefit}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
