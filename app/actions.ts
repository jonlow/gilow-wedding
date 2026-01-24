"use server";

export async function submitRsvp(formData: FormData) {
  const response = formData.get("response") as string;

  console.log("RSVP Form submitted:", { response });

  // Simulate a small delay like a real API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return { success: true, response };
}
