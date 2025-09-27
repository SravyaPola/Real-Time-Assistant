export async function nextBestActionsFor(text: string) {
  const events: any[] = [];
  if (/refund/i.test(text)) {
    events.push({ type: 'next_best_action', text: 'Ask if the customer has a receipt.' });
    events.push({ type: 'kb_citation', text: 'Refunds: 5–7 days to process (Policy §3).' });
  }
  if (/exchange/i.test(text)) {
    events.push({ type: 'next_best_action', text: 'Verify item condition and restock eligibility.' });
    events.push({ type: 'kb_citation', text: 'Exchanges allowed within 30 days (Policy §4).' });
  }
  return events;
}
