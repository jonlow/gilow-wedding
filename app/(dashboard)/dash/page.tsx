import { getGuests, getSession } from "./auth-actions";
import { LoginForm } from "./login-form";
import { Dashboard } from "./dashboard";

export default async function DashPage() {
  const session = await getSession();

  if (!session.authenticated) {
    return <LoginForm />;
  }

  const guests = await getGuests();

  return <Dashboard user={session.user} guests={guests} />;
}
