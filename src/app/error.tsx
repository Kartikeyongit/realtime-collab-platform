'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', padding: '40px' }}>
      <p style={{ fontSize: '18px', fontWeight: 600, color: '#44403c' }}>Something went wrong</p>
      <p style={{ fontSize: '13px', color: '#a8a29e', maxWidth: '400px', textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <button onClick={reset} className="btn btn-secondary">
        Try again
      </button>
    </div>
  );
}
