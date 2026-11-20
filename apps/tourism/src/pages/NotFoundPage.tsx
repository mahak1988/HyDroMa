import { Link } from "react-router-dom";
import { useTourism } from "../content";
import { EmptyState } from "@eco-nojin/ui";
import { PageHeader } from "../components/Cards";

export function NotFoundPage() {
  const c = useTourism();
  return (
    <div>
      <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
      <div className="mt-5">
        <EmptyState
          title={c.ui.notFoundTitle}
          body={c.ui.notFoundBody}
          action={<Link to="/" className="text-sm font-medium text-primary hover:underline">{c.ui.backHome}</Link>}
        />
      </div>
    </div>
  );
}