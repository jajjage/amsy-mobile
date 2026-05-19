import { Redirect } from "expo-router";

export default function ReferralRedirect() {
  return <Redirect href={"/(tabs)/agent" as any} />;
}
