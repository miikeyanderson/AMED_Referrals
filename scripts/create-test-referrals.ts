
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
    },
    {
      referrerId: 2,
      candidateName: "Emily Davis",
      candidateEmail: "emily.d@example.com",
      candidatePhone: "123-456-7893",
      position: "Data Scientist",
      department: "Data",
      experience: "4 years in machine learning",
      status: "hired",
      notes: "Strong background in ML and statistics",
      nextSteps: "Onboarding scheduled"
    },
    {
      referrerId: 2,
      candidateName: "David Wilson",
      candidateEmail: "d.wilson@example.com",
      candidatePhone: "123-456-7894",
      position: "DevOps Engineer",
      department: "Engineering",
      experience: "7 years in cloud infrastructure",
      status: "rejected",
      notes: "Not enough experience with required technologies",
      nextSteps: "Send rejection email"
    },
    {
      referrerId: 3,
      candidateName: "Lisa Brown",
      candidateEmail: "lisa.b@example.com",
      candidatePhone: "123-456-7895",
      position: "Marketing Manager",
      department: "Marketing",
      experience: "6 years in digital marketing",
      status: "interviewing",
      notes: "Great presentation skills",
      nextSteps: "Schedule final round"
    }
  ]);
  
  console.log("Test referrals created successfully");
}

createTestReferrals().catch(console.error);
