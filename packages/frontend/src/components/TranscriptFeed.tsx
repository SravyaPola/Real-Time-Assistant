type Item = { text: string, kind: 'partial'|'final' } | string;

export default function TranscriptFeed({ items }: { items: Item[] }) {
  return (
    <div style={{ border: '1px solid #ddd', minHeight: 240, padding: 12 }}>
      {items.map((t: any, i: number) => {
        const text = typeof t === 'string' ? t : t.text;
        const kind = typeof t === 'string' ? 'partial' : t.kind;
        return (
          <div key={i}>
            {kind === 'final' ? <strong>{text}</strong> : <span>{text}</span>}
          </div>
        );
      })}
    </div>
  );
}
