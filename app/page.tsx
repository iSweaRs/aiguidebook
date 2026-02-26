import { redirect } from "next/navigation";

export default function Home() {
  // This will trigger a server-side redirect immediately
  redirect("/dashboard");

  // You can return null because the code below will never be reached
  return null;
}