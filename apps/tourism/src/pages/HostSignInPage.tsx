import { Link } from "react-router-dom";
import { Button, Card, CardBody } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { useTourismSession } from "../session/TourismSession";

/**
 * Host sign-in. Rendered inside `TourismLayout`, so it must not wrap itself in
 * the layout. There is no identity service yet, so this is an explicit demo
 * sign-in; when OIDC lands this page becomes a redirect.
 */
export function HostSignInPage() {
  const c = useTourism();
  const { signInAsHost } = useTourismSession();

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardBody className="space-y-4">
          <h1 className="text-lg font-semibold text-fg">{c.host.title}</h1>
          <p className="text-xs text-fg-muted">{c.host.demoNote}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={signInAsHost}>
              {c.host.signInCta}
            </Button>
            <Link to="/">
              <Button variant="ghost">{c.ui.backHome}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}