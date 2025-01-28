
import { db } from "../db";
import { jobs } from "../db/schema";

async function addTestJobs() {
  await db.insert(jobs).values([
    {
      title: "ICU Nurse Manager",
      specialty: "nursing",
      location: { city: "Los Angeles", state: "CA", coordinates: { latitude: 34.0522, longitude: -118.2437 } },
      basePay: 125000,
      bonusAmount: 10000,
      bonusDetails: "Leadership bonus after 6 months",
      description: "Lead a team of ICU nurses in a Level 1 trauma center",
      requirements: "5+ years ICU experience, BSN required, MSN preferred",
      benefits: ["Health insurance", "401k match", "Educational assistance"],
      shift: "day",
      type: "full-time",
      department: "Critical Care",
      facility: "LA Medical Center",
      recruiterId: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Adding 9 more jobs with varied details...
    {
      title: "Emergency Room RN",
      specialty: "nursing", 
      location: { city: "Houston", state: "TX", coordinates: { latitude: 29.7604, longitude: -95.3698 } },
      basePay: 85000,
      bonusAmount: 5000,
      bonusDetails: "Sign-on bonus after 90 days",
      description: "Join our dynamic ER team",
      requirements: "2+ years ER experience, BLS/ACLS required",
      benefits: ["Health insurance", "Shift differentials", "PTO"],
      shift: "rotating",
      type: "full-time",
      department: "Emergency",
      facility: "Houston Memorial",
      recruiterId: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

addTestJobs()
  .then(() => console.log('Test jobs added successfully'))
  .catch(console.error);
