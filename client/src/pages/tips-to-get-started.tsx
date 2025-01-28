
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Gift, Users, HelpCircle, ArrowRight } from "lucide-react";

export default function TipsToGetStarted() {
  return (
    <ScrollArea>
      <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl min-h-screen">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Getting Started is Simple
          </h1>
          <p className="text-lg text-muted-foreground">
            Follow these steps to start earning rewards today.
          </p>
          <Button size="lg" className="mt-6">
            Make a Referral
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>

        {/* Step-by-Step Guide */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            How It Works in 4 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="flex flex-row items-center space-x-4">
                <Badge variant="secondary" className="h-10 w-10 rounded-full p-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </Badge>
                <CardTitle>Submit a Referral</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Click the <span className="font-medium">Make a Referral</span> button and fill out your
                colleague's details.
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="flex flex-row items-center space-x-4">
                <Badge variant="secondary" className="h-10 w-10 rounded-full p-2">
                  <Users className="h-5 w-5 text-primary" />
                </Badge>
                <CardTitle>Share Documents</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Ensure your referral uploads certifications, resumes, and other documents.
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="flex flex-row items-center space-x-4">
                <Badge variant="secondary" className="h-10 w-10 rounded-full p-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </Badge>
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Use your dashboard to see the status of your referral in real-time.
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="flex flex-row items-center space-x-4">
                <Badge variant="secondary" className="h-10 w-10 rounded-full p-2">
                  <Gift className="h-5 w-5 text-primary" />
                </Badge>
                <CardTitle>Earn Rewards</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Once your referral is hired, your reward will be credited directly to your account.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pro Tips Section */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader>
            <CardTitle className="text-2xl text-center">Pro Tips to Boost Your Success</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                "Refer colleagues who are actively looking for jobs",
                "Share high-demand job openings to get quicker responses",
                "Follow up with your colleagues to ensure they've completed their profile",
                "Ensure documents are uploaded for faster processing"
              ].map((tip, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <Badge variant="secondary" className="mt-1 h-2 w-2 rounded-full p-1" />
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Call-to-Action Section */}
        <section className="text-center space-y-6">
          <h2 className="text-2xl font-semibold">
            Ready to Earn? Start Referring Today!
          </h2>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Make a Referral
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    </ScrollArea>
  );
}
