import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  Gift,
  Users,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function TipsToGetStarted() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 border-b">
        <motion.div 
          className="container mx-auto py-16 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
              Welcome to Your Success Journey
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn how to make successful referrals and earn rewards while helping healthcare professionals find their perfect roles.
            </p>
            <Button
              size="lg"
              className="animate-pulse"
              onClick={() => setLocation("/dashboard/clinician/refer")}
            >
              Start Your First Referral
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      <div className="container mx-auto py-12 px-4 space-y-12">
        {/* Step by Step Guide */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <motion.div variants={item}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <CardTitle>1. Submit a Referral</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Use our streamlined form to submit candidate details. Quality information increases success rates!
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Complete all required fields</li>
                    <li>• Add relevant experience details</li>
                    <li>• Include current availability</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>2. Track Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Monitor your referral status in real-time through your personalized dashboard.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• View application status</li>
                    <li>• Get instant notifications</li>
                    <li>• Track interview schedules</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-primary" />
                    <CardTitle>3. Earn Rewards</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get rewarded for successful placements and quality referrals.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Placement bonuses</li>
                    <li>• Quality referral points</li>
                    <li>• Performance incentives</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Pro Tips Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 rounded-lg p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">Pro Tips for Success</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Quality Over Quantity</h3>
                <p className="text-muted-foreground text-sm">
                  Focus on matching candidates with relevant experience to open positions. This increases placement success rates.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Stay Updated</h3>
                <p className="text-muted-foreground text-sm">
                  Regularly check your dashboard for new opportunities and updates on your referrals.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Complete Information</h3>
                <p className="text-muted-foreground text-sm">
                  Provide detailed candidate information to speed up the processing time.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Follow Up</h3>
                <p className="text-muted-foreground text-sm">
                  Maintain communication with your referrals to ensure they're engaged in the process.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I earn rewards?</AccordionTrigger>
              <AccordionContent>
                Earn rewards through successful placements, quality referrals, and consistent platform engagement. Each successful placement can earn you up to $500!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What makes a good referral?</AccordionTrigger>
              <AccordionContent>
                A good referral includes accurate contact information, relevant experience details, and current availability. The more complete the information, the higher the chances of success.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How long does the process take?</AccordionTrigger>
              <AccordionContent>
                The referral process typically takes 2-4 weeks, depending on position requirements and candidate availability. You can track progress in real-time through your dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>When do I receive my rewards?</AccordionTrigger>
              <AccordionContent>
                Rewards are processed within 30 days of successful placement. You can track your pending and processed rewards in the rewards dashboard.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Support Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Need Help?</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help you succeed. Reach out anytime for assistance with your referrals.
          </p>
          <Button variant="outline" size="lg">
            Contact Support
          </Button>
        </motion.section>
      </div>

      {/* Sticky CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden"
      >
        <Button
          className="w-full"
          size="lg"
          onClick={() => setLocation("/dashboard/clinician/refer")}
        >
          Start Referring Now
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}