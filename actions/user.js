"use server";

import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";
import { success } from "zod";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Update user data logic here

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  // If user does not exist in our database
  if (!user) throw new Error("User not found");

  //connect to our database and update the user data

  try {
    const result = await db.$transaction(
      async (tx) => {
        //Find if the industry insights exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });
        // If it does not exist, create it with default values - will replace it with ai later
        if (!industryInsight) {
          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              salaryRanges: [],
              growthRate: 0,
              demandLevel: "MEDIUM",
              topSkills: [],
              marketOutlook: "NEUTRAL",
              keyTrends: [],
              recommendedSkills: [],
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }
        //Update the user

        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });
        return { updatedUser, industryInsight };
      },
      {
        timeout: 10000, // 10 seconds
      },
    );
    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating user and industry insights:", error.message);
    throw new Error("Failed to update profile" + error.message);
  }
}

//Get user onboarding status
export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });
    return { isOnboarded: !!user.industry };
  } catch (error) {
    console.error("Error fetching user onboarding status:", error.message);
    throw new Error("Failed to fetch onboarding status");
  }
}
