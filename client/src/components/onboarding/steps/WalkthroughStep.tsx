import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Users, Trophy } from "lucide-react";

interface WalkthroughStepProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: FileText,
    title: "1. Refer a colleague",
    description: "Fill out a simple form with your colleague's information",
  },
  {
    icon: Users,
    title: "2. We handle the rest",
    description: "Our recruiters will contact and guide your referral through the process",
  },
  {
    icon: Trophy,
    title: "3. Earn your reward",
    description: "Receive $500 when your referral gets placed",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export function WalkthroughStep({ onComplete }: WalkthroughStepProps) {
  return (
    <div className="space-y-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8"
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
            variants={item}
            className="flex items-center gap-6"
          >
            <div className="shrink-0 rounded-full bg-primary/10 p-4">
              <step.icon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                className="absolute left-[2.25rem] h-12 w-px bg-border"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center pt-4">
        <Button onClick={onComplete} size="lg">
          Show Me Around
        </Button>
      </div>
    </div>
  );
}
