import { getSession } from "./auth-actions";
import { getSessionToken, preloadGuests } from "./data";
import { LoginForm } from "./login-form";
import { Dashboard } from "./dashboard";

export default async function DashPage() {
  const session = await getSession();

  if (!session.authenticated) {
    return <LoginForm />;
  }

  const token = await getSessionToken();
  if (!token) {
    return <LoginForm />;
  }

  const preloadedGuests = await preloadGuests(token);

  return <Dashboard user={session.user} preloadedGuests={preloadedGuests} token={token} />;
}
