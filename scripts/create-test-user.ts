
import { db } from "../db";
import { users } from "../db/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUsers() {
  const hashedPassword = await hashPassword("test123");
  
  await db.insert(users).values([
    {
      id: 1,
      username: "testuser1",
      password: hashedPassword,
      role: "clinician",
      name: "Test User 1",
      email: "test1@example.com"
    },
    {
      id: 2, 
      username: "testuser2",
      password: hashedPassword,
      role: "clinician",
      name: "Test User 2", 
      email: "test2@example.com"
    },
    {
      id: 3,
      username: "testuser3", 
      password: hashedPassword,
      role: "clinician",
      name: "Test User 3",
      email: "test3@example.com"
    }
  ]);
  
  console.log("Test users created successfully");
}

createTestUsers().catch(console.error);
