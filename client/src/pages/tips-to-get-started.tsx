import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Gift, Users, HelpCircle } from "lucide-react";

export default function TipsToGetStarted() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-white">Getting Started is Simple</h1>
        <p className="mt-2 text-lg text-gray-300">
          Follow these steps to start earning rewards today.
        </p>
        <button className="mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">
          Make a Referral
        </button>
      </section>

      {/* Step-by-Step Guide */}
      <section>
        <h2 className="text-2xl font-semibold text-white text-center">
          How It Works in 4 Simple Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Step 1 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex items-center space-x-4">
              <ClipboardList className="w-10 h-10 text-green-500" />
              <CardTitle className="text-white">Submit a Referral</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Click the <strong>“Make a Referral”</strong> button and fill out your
              colleague’s details.
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex items-center space-x-4">
              <Users className="w-10 h-10 text-green-500" />
              <CardTitle className="text-white">Share Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Ensure your referral uploads certifications, resumes, and other documents.
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex items-center space-x-4">
              <HelpCircle className="w-10 h-10 text-green-500" />
              <CardTitle className="text-white">Track Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Use your dashboard to see the status of your referral in real-time.
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex items-center space-x-4">
              <Gift className="w-10 h-10 text-green-500" />
              <CardTitle className="text-white">Earn Rewards</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Once your referral is hired, your reward will be credited directly to your
              account.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pro Tips Section */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-white text-center">
          Pro Tips to Boost Your Success
        </h2>
        <ul className="mt-4 space-y-3 text-gray-300 list-disc list-inside">
          <li>Refer colleagues who are actively looking for jobs.</li>
          <li>Share high-demand job openings to get quicker responses.</li>
          <li>Follow up with your colleagues to ensure they’ve completed their profile.</li>
          <li>Ensure documents are uploaded for faster processing.</li>
        </ul>
      </section>

      {/* Call-to-Action Section */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold text-white">
          Ready to Earn? Start Referring Today!
        </h2>
        <button className="mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">
          Make a Referral
        </button>
      </section>
    </div>
  );
}
