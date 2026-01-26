import { getSession } from "./auth-actions";
import { LoginForm } from "./login-form";
import { Dashboard } from "./dashboard";

export default async function DashPage() {
  const session = await getSession();

  if (!session.authenticated) {
    return <LoginForm />;
  }

  return <Dashboard user={session.user} />;
}
