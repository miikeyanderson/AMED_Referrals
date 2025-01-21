
import { db } from "../db";
import { referrals } from "../db/schema";

async function createTestReferrals() {
  await db.insert(referrals).values([
    {
      referrerId: 1,
      candidateName: "John Smith",
      candidateEmail: "john.smith@example.com",
      candidatePhone: "123-456-7890",
      position: "Senior Software Engineer",
      department: "Engineering",
      experience: "8 years in full-stack development",
      status: "interviewing",
      notes: "Strong candidate with React and Node.js expertise",
      nextSteps: "Schedule technical interview"
    },
    {
      referrerId: 1,
      candidateName: "Sarah Johnson",
      candidateEmail: "sarah.j@example.com",
      candidatePhone: "123-456-7891",
      position: "Product Manager",
      department: "Product",
      experience: "5 years in product management",
      status: "contacted",
      notes: "Previous experience at top tech companies",
      nextSteps: "Initial screening call scheduled"
    },
    {
      referrerId: 1,
      candidateName: "Michael Chen",
      candidateEmail: "m.chen@example.com",
      candidatePhone: "123-456-7892",
      position: "UX Designer",
      department: "Design",
      experience: "6 years in UX/UI design",
      status: "pending",
      notes: "Impressive portfolio",
      nextSteps: "Review design samples"
    }
  ]);
  
  console.log("Test referrals created successfully");
}

createTestReferrals().catch(console.error);
