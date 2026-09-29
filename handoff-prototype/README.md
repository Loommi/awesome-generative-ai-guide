# Handoff: a cross-screen throw prototype

You flick an object off a tablet and it carries on flying onto a wall display, like the handoff in *Avatar* (2009). It is not screen mirroring and it is not a file transfer. Each screen renders the same preloaded asset, and only a small motion event crosses the network. The display uses that event to continue the throw.

```
Controller (tablet)  ──object_handoff──▶  room channel  ──▶  Display (wall)
      ▲                                                          │
      └──────────────── object_handoff (return) ◀────────────────┘
```

## Run it

```bash
cd handoff-prototype
npm install
npm run dev            # or: npm run build && npm start  (smoother for demos)
```

**Same machine (no setup):** open two windows of the same browser:

- `http://localhost:3000/display?room=test`
- `http://localhost:3000/controller?room=test`

With no Supabase credentials, realtime falls back to `BroadcastChannel`. That only works between tabs of one browser profile. Keep both windows visible, because browsers throttle animation in hidden tabs.

**Tablet + TV / laptop:** this needs Supabase (see below), because BroadcastChannel can't cross devices.

1. Open `/display` on the big screen. It creates a room code such as `A7KF` and shows a QR code.
2. Scan the QR code with the iPad, or open `/controller` and type the code.
3. The display shows *Controller connected* and the tablet shows *Display ready*.

The QR code points at the origin the display was opened from. If that is `localhost`, open the display using your LAN IP (for example `http://192.168.1.20:3000/display`), or set `NEXT_PUBLIC_APP_URL`. The dev server already allows common LAN origins. You can add others with `DEV_ORIGINS=host1,host2`.

On the display, press **F** or double-click empty space to go fullscreen. On the iPad, *Add to Home Screen* gives a chrome-free controller.

### Deploy to Vercel

1. In Vercel: **Add New → Project**, import `Loommi/awesome-generative-ai-guide`.
2. Set **Root Directory** to `handoff-prototype`. The framework preset (Next.js) is detected automatically.
3. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see below). Without them the deployed site still works, but only between two windows of the same browser.
4. **Deploy.** Open `https://<your-app>.vercel.app/display` on the big screen and scan the QR code with the tablet.

`NEXT_PUBLIC_APP_URL` is not needed on Vercel: the QR code uses the URL the display was opened from. These variables are baked in at build time, so redeploy after changing them.

### Supabase Realtime

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

It uses only Realtime **Broadcast**, so there are no tables, auth or RLS to set up. Add `?transport=local` to either URL to force the BroadcastChannel fallback.

## Using it

There are four objects: Lumen Seed, Aurora Shard, Tidal Map and Signal Bloom. Each one is thrown, caught and returned independently. On a portrait tablet they sit in a 2×2 grid, and on the wall they sit in a row. Each object lands in its own slot, so you can have several on the display at once.

| Where | Gesture | Result |
|---|---|---|
| Controller | drag any object | It follows your finger, lifts above the others and leans; springs back to its slot on release |
| Controller | quick flick upward | That object accelerates off the top and lands in its slot on the display |
| Controller | tap an empty **On display** slot | The display sends that object back |
| Either screen | tap an object | Opens its detail view: the card zooms out of its slot with a shockwave, a hologram powers on beside it, and stats count up. **Send to display** / **Return to tablet** closes it and throws. Tap outside, **Close** or Esc zooms it back |
| Display | flick it downward | Sends it back directly |

A throw counts only when all of these hold (`lib/handoff/gesture.ts`, `THROW`):

- speed ≥ 1000 px/s, with ≥ 800 px/s of it toward the edge
- aimed within ~45° of straight up (or straight down on the display)
- moved at least 24 px

If the finger rested before lifting (more than 60 ms stale), it counts as a placement, not a throw. Slow drags never trigger a throw.

Add `?debug=true` to either URL for the overlay. It shows the room, transport state, peer, phase, release speed and vector, why a release was or wasn't a throw, latency, the last event time and the raw payload.

## How the illusion works

- **One flight, two screens.** The event is sent at the moment of release, not when the exit ends. It carries the direction, speed (px/s and viewport-heights/s), the release point, where the object crossed the edge (`edgeX`) and the exit duration.
- **Outgoing** (`planExit`): the object starts at the finger's release speed and accelerates along the flick vector, scaling down slightly. It takes about 140–250 ms, depending on speed and distance.
- **Incoming** (`planEntry`): the object appears just past the matching edge at the same relative x. Its path is a curve that starts tangent to the throw direction and bends into that object's slot. Harder throws start further back, travel faster (≈270 ms rather than 400 ms), decelerate harder and overshoot very slightly. The object scales up from 0.82 to 1 as it arrives.
- **Timing.** The display starts the entrance at `exitDuration × 0.85 + airGap` after the release timestamp. `airGap` is 25–80 ms and shrinks with speed. Network latency (`Date.now() − event.timestamp`) is subtracted from that wait. If the event arrives late, the animation starts part-way through instead of replaying from the beginning. A light clock-skew guard ignores obviously skewed device clocks. Measured locally, the display picks the object up about 20 ms after it fully leaves the tablet.
- **Recovery.** Presence heartbeats carry `held` (the ids on that screen), so if either device reloads, the controller works out where each object is.

Throw on the controller, and the display receives:

```json
{
  "type": "object_handoff",
  "objectId": "demo-object-01",
  "source": "controller",
  "destination": "display",
  "direction": { "x": 0.22, "y": -0.97 },
  "velocity": 2436,
  "velocityNorm": 2.06,
  "release": { "x": 0.57, "y": 0.28 },
  "edgeX": 0.67,
  "exitDuration": 188,
  "id": "4ke6yl92",
  "timestamp": 1790653297631
}
```

## Code map

```
lib/handoff/
  types.ts              HandoffEvent, DeviceRole, event payloads
  transport.ts          Transport interface + createTransport() (picks Supabase or local)
  supabaseTransport.ts  Supabase Realtime broadcast channel
  broadcastTransport.ts BroadcastChannel fallback
  useRoomSession.ts     room join, presence/heartbeat, latency estimate (RoomSession)
  gesture.ts            VelocityTracker (least squares over last 90 ms) + analyzeThrow
  trajectory.ts         planExit / planEntry: gesture → motion on each screen
  motion.ts             Pose, rAF tween, momentum spring
  useThrowable.ts       drag / throw / catch state machine for one object (animation state)
  objects.ts            the object catalog (id, name, asset, glow colour)
  layout.ts / useSlots  resting slot for each object on each screen
  room.ts               room codes
components/
  ControllerView.tsx    /controller
  DisplayView.tsx       /display
  PairingPanel.tsx      QR + room code
  ThrowableObject.tsx   one object in its slot (assets in public/objects/)
  DetailView.tsx        zoomed "inspect" view (FLIP zoom, burst, stats)
  Holograms.tsx         the animated SVG hologram for each object
```

UI components never touch a transport. They use `useRoomSession` and `useThrowable`. To add or swap an object, edit `OBJECTS` in `lib/handoff/objects.ts` and put a 4:5 image in `public/objects/`. The layout adapts to the number of objects.
