import { useState, useEffect } from 'react';

interface RelativeTimeProps {
  date: string | Date;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

export default function RelativeTime({ date }: RelativeTimeProps) {
  const [text, setText] = useState(() => formatRelative(new Date(date)));

  useEffect(() => {
    setText(formatRelative(new Date(date)));
    const interval = setInterval(() => {
      setText(formatRelative(new Date(date)));
    }, 60_000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <time
      dateTime={new Date(date).toISOString()}
      className="text-muted-foreground"
      data-icod-id="src_components_shared_relativetime_tsx_a44b">
      {text}
    </time>
  );
}
