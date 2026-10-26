import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

import { translations } from '@/translations';

const defaultCopy = {
  title: translations.ar.common.errorTitle,
  body: translations.ar.common.errorBody,
  retry: translations.ar.common.errorRetry,
};

export interface ErrorCopy {
  title: string;
  body: string;
  retry: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  copy: ErrorCopy;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
  /** Localized user-facing copy (supplied from translations.ts). */
  copy?: ErrorCopy;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError, copy }: ErrorFallbackProps) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-6" role="alert">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm">{copy.body}</p>
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded p-3 text-left text-xs" dir="ltr">
            {error.message || String(error)}
          </pre>
        ) : null}
        <button type="button" onClick={resetError} className="m-btn m-btn-primary mt-4">
          {copy.retry}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} copy={this.props.copy ?? defaultCopy} />;
  }
}
