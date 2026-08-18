import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/user";

export default async function IndustryInsightsPage() {
  //Check if user is already onboarded, if so redirect to dashboard

  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return <div>Indusrty Page</div>;
}
