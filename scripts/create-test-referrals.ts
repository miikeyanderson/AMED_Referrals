
import { db } from "@db";
import { referrals } from "@db/schema";

async function createTestReferrals() {
  await db.insert(referrals).values([
    {
      referrerId: 1,
      candidateName: "John Smith",
      candidateEmail: "john.smith@example.com",
      candidatePhone: "123-456-7890",
      position: "Senior Frontend Developer",
      department: "Engineering",
      status: "pending",
      experience: "8 years of React experience",
      notes: "Strong portfolio, previously at Google",
      nextSteps: "Schedule technical interview",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      referrerId: 1,
      candidateName: "Sarah Wilson",
      candidateEmail: "sarah.wilson@example.com",
      candidatePhone: "123-456-7891",
      position: "Product Designer",
      department: "Design",
      status: "contacted",
      experience: "6 years in product design",
      notes: "Great portfolio, interested in UI/UX",
      nextSteps: "Design challenge review",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      referrerId: 2,
      candidateName: "Michael Chen",
      candidateEmail: "michael.chen@example.com",
      candidatePhone: "123-456-7892",
      position: "Backend Engineer",
      department: "Engineering",
      status: "interviewing",
      experience: "5 years Node.js experience",
      notes: "Strong system design skills",
      nextSteps: "Final interview round",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      referrerId: 2,
      candidateName: "Emily Davis",
      candidateEmail: "emily.davis@example.com",
      candidatePhone: "123-456-7893",
      position: "DevOps Engineer",
      department: "Infrastructure",
      status: "hired",
      experience: "7 years of DevOps experience",
      notes: "Excellent cultural fit",
      nextSteps: "Onboarding preparation",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      referrerId: 3,
      candidateName: "David Kim",
      candidateEmail: "david.kim@example.com",
      candidatePhone: "123-456-7894",
      position: "Data Scientist",
      department: "Data",
      status: "rejected",
      experience: "3 years ML experience",
      notes: "Good technical skills, misaligned expectations",
      nextSteps: "Send rejection email",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  console.log("Test referrals created successfully");
}

createTestReferrals().catch(console.error);
