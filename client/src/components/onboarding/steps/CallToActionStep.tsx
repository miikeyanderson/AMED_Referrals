import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Send, ArrowRight, Star } from "lucide-react";

interface CallToActionStepProps {
  onComplete: () => void;
}

export function CallToActionStep({ onComplete }: CallToActionStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Star className="h-8 w-8 text-primary" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold tracking-tight">
            Start Earning Today!
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You're all set to make your first referral. Take advantage of your network and earn rewards!
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Your next step:</h3>
              <p className="text-sm text-muted-foreground">
                Make your first referral and start your journey
              </p>
            </div>
          </div>
          
          <Button className="w-full gap-2" size="lg" onClick={onComplete}>
            Refer a Colleague Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          You're one step closer to earning your first reward!
        </motion.div>
      </motion.div>
    </div>
  );
}
