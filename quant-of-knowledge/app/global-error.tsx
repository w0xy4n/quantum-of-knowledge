"use client";

import { useEffect } from "react";

const styles = `
  .ge-root {
    --ge-bg: #f9f9fb;
    --ge-fg: #101317;
    --ge-card: #ffffff;
    --ge-border: #dfe1e6;
    --ge-muted: #6b7280;
    --ge-primary: #0d9488;
    --ge-primary-fg: #ffffff;
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: var(--ge-bg);
    color: var(--ge-fg);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    .ge-root {
      --ge-bg: #101317;
      --ge-fg: #f9f9fb;
      --ge-card: #16191e;
      --ge-border: #292d34;
      --ge-muted: #969ba5;
      --ge-primary: #14b8a6;
      --ge-primary-fg: #0b1413;
    }
  }
  .ge-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    color: var(--ge-primary);
    font-size: 1.5rem;
    font-weight: 700;
  }
  .ge-card {
    width: 100%;
    max-width: 24rem;
    padding: 1.5rem;
    border: 1px solid var(--ge-border);
    border-radius: 0.625rem;
    background: var(--ge-card);
    text-align: center;
  }
  .ge-card h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; }
  .ge-card p { margin: 0; font-size: 0.875rem; line-height: 1.5; color: var(--ge-muted); }
  .ge-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
  .ge-button {
    display: block;
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    background: var(--ge-primary);
    color: var(--ge-primary-fg);
  }
  .ge-button--outline { background: transparent; border-color: var(--ge-border); color: var(--ge-fg); }
  .ge-digest { margin-top: 1rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; color: var(--ge-muted); }
`;

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <style>{styles}</style>
        <div className="ge-root">
          <div>
            <div className="ge-brand">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 7v14" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
              </svg>
              <span>Квант-знаний</span>
            </div>
            <div className="ge-card">
              <h1>Что-то пошло не так</h1>
              <p>
                Не удалось запустить приложение. Ваши задания в безопасности — это проблема отображения, а не данных.
              </p>
              <div className="ge-actions">
                <button type="button" className="ge-button" onClick={reset}>
                  Попробовать снова
                </button>
                <a className="ge-button ge-button--outline" href="/">
                  На главную
                </a>
              </div>
              {error.digest && <p className="ge-digest">ID ошибки: {error.digest}</p>}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
