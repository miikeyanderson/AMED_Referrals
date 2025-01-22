import { db } from "@db";
import { referrals } from "@db/schema";

async function createTestReferrals() {
  await db.insert(referrals).values([
    {
      referrerId: 1,
      candidateName: "John Smith",
      candidateEmail: "john.s@example.com",
      candidatePhone: "123-456-7891",
      position: "Frontend Developer",
      department: "Engineering",
      status: "pending",
      nextSteps: "Initial screening"
    },
    {
      referrerId: 1,
      candidateName: "Sarah Wilson",
      candidateEmail: "sarah.w@example.com",
      candidatePhone: "123-456-7892",
      position: "UI Designer",
      department: "Design",
      status: "contacted",
      nextSteps: "Schedule interview"
    },
    {
      referrerId: 1,
      candidateName: "Mike Johnson",
      candidateEmail: "mike.j@example.com",
      candidatePhone: "123-456-7893",
      position: "Backend Developer",
      department: "Engineering",
      status: "interviewing",
      nextSteps: "Technical interview"
    },
    {
      referrerId: 1,
      candidateName: "Emily Davis",
      candidateEmail: "emily.d@example.com",
      candidatePhone: "123-456-7894",
      position: "Product Designer",
      department: "Design",
      status: "hired",
      nextSteps: "Onboarding"
    },
    {
      referrerId: 1,
      candidateName: "Chris Wilson",
      candidateEmail: "chris.w@example.com",
      candidatePhone: "123-456-7895",
      position: "DevOps Engineer",
      department: "Engineering",
      status: "rejected",
      nextSteps: "Close candidacy"
    }
  ]);

  console.log("Test referrals created successfully");
}

createTestReferrals().catch(console.error);