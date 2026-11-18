import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

export type ErrorBoundaryLabels = {
  title: string;
  body: string;
  retry: string;
  reload: string;
};

type Props = {
  children: ReactNode;
  labels: ErrorBoundaryLabels;
  /** Changing this value clears the error and remounts the children. */
  resetKey?: string | number;
};

type State = { error: Error | null };

/**
 * Last-resort boundary. Route-level boundaries are provided by the router;
 * this one protects the whole application shell. Labels are injected by the
 * application so this package stays free of localization and domain knowledge.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Phase 1 has no telemetry sink; keep the console signal and the component stack.
    console.error("[eco] render error", error, info.componentStack);
  }

  override componentDidUpdate(previous: Props): void {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const { labels } = this.props;

    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col gap-3 rounded-lg border border-danger/30 bg-danger-soft p-6 text-center"
      >
        <h1 className="text-lg font-semibold text-fg">{labels.title}</h1>
        <p className="text-sm text-fg-muted">{labels.body}</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg"
          >
            {labels.retry}
          </button>
          <a
            href="/"
            className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm text-fg"
          >
            {labels.reload}
          </a>
        </div>
      </div>
    );
  }
}