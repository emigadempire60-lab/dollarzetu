import { NextResponse } from 'next/server';
import type { TradeSignal } from '@/lib/signals';

// In-memory signal store for the server instance (keeps last 50 signals)
let signalStore: TradeSignal[] = [];

// Subscribers array for Server-Sent Events (SSE)
type Controller = ReadableStreamDefaultController;
const clients = new Set<Controller>();

export const dynamic = 'force-dynamic';

/**
 * GET: Returns recent signals as JSON, or upgrades to SSE (Server-Sent Events) stream
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // If streaming mode requested via ?stream=true or Accept: text/event-stream
  const isStream = searchParams.get('stream') === 'true' || request.headers.get('accept') === 'text/event-stream';

  if (isStream) {
    const stream = new ReadableStream({
      start(controller) {
        clients.add(controller);

        // Send initial heartbeat and current signals snapshot
        const initData = JSON.stringify({ type: 'INIT', signals: signalStore.slice(0, 10) });
        controller.enqueue(`data: ${initData}\n\n`);

        request.signal.addEventListener('abort', () => {
          clients.delete(controller);
          try {
            controller.close();
          } catch (_) {}
        });
      },
      cancel(controller) {
        clients.delete(controller);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // Standard JSON response
  return NextResponse.json({
    success: true,
    signals: signalStore.slice(0, 20),
    activeListeners: clients.size,
  });
}

/**
 * POST: Master Trader posts a new signal to broadcast to all clients
 */
export async function POST(request: Request) {
  try {
    const body: TradeSignal = await request.json();

    if (!body || !body.symbol || !body.contractType) {
      return NextResponse.json({ success: false, error: 'Invalid signal payload' }, { status: 400 });
    }

    const newSignal: TradeSignal = {
      id: body.id || `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: body.timestamp || Date.now(),
      symbol: body.symbol,
      symbolDisplayName: body.symbolDisplayName || body.symbol,
      contractType: body.contractType,
      selectedDigit: typeof body.selectedDigit === 'number' ? body.selectedDigit : 5,
      duration: body.duration || 5,
      recommendedStake: body.recommendedStake || 10,
      masterName: body.masterName || 'Master Guide',
      note: body.note || '',
    };

    // Prepend to server memory store
    signalStore = [newSignal, ...signalStore.filter((s) => s.id !== newSignal.id)].slice(0, 50);

    // Push to all active SSE subscribers
    const payload = `data: ${JSON.stringify({ type: 'NEW_SIGNAL', signal: newSignal })}\n\n`;
    clients.forEach((controller) => {
      try {
        controller.enqueue(payload);
      } catch (err) {
        clients.delete(controller);
      }
    });

    return NextResponse.json({
      success: true,
      signal: newSignal,
      listenersNotified: clients.size,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
