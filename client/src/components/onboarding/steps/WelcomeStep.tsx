import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ClipboardList, Clock, DollarSign } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

const benefits = [
  {
    icon: ClipboardList,
    title: "Effortless Referrals",
    description: "Submit referrals in minutes using our streamlined process",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description: "Monitor your referrals' progress with live status updates",
  },
  {
    icon: DollarSign,
    title: "Rewarding Success",
    description: "Earn $500 for every successful placement",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to Your Referral Hub!
        </h1>
        <p className="text-muted-foreground text-lg">
          Refer. Track. Earn.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6"
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            variants={item}
            className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
          >
            <div className="rounded-full bg-primary/10 p-2">
              <benefit.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center">
        <Button size="lg" onClick={onNext} className="gap-2">
          Let's Get Started
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.div>
        </Button>
      </div>
    </div>
  );
}
