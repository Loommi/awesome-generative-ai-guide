# PROXIMA — Mission Command (cross-screen handoff prototype)

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
3. The wall shows *CONTROLLER CONNECTED* and the tablet shows *COMMAND DISPLAY LINKED*.

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

The prototype is dressed as **PROXIMA / EOS Mission Command**. The tablet is a *portable operations terminal* and the wall is the *mission command interface*. Four mission modules are the throwable objects:

| # | Module | Accent | Content |
|---|---|---|---|
| 01 | EOS | cyan `#63D9E8` | Vessel overview: generation ship, 10,000 people, bound for Proxima Centauri |
| 02 | NAVIGATION | amber `#E6B66A` | Illustrative Sol → Proxima Centauri trajectory; Atlas and nuclear pulse propulsion |
| 03 | COMMAND | violet `#9D8FD6` | Mission leadership: Captain Elena precedes Captain Sophia |
| 04 | ANOMALY | red `#CD655F` | Unidentified structure in the Proxima system; origin and purpose unresolved |

Each module is thrown, caught and returned independently and lands in its own slot, so any combination can be on the wall at once. Cartridges show a status: `AVAILABLE`, `TRANSFERRING`, `RETRIEVING`, `ACTIVE` (on the wall) or `RETURNING`.

| Where | Gesture | Result |
|---|---|---|
| Tablet | drag a module | It follows your finger and springs back to its slot on release |
| Tablet | quick flick upward | The module flies off the top and lands in its slot on the wall. The `FLICK UP TO TRANSFER` hint disappears after the first successful transfer |
| Tablet | tap a module | Full-screen inspector; **TRANSFER TO COMMAND DISPLAY** closes it and throws |
| Tablet | tap an empty dock (`ON COMMAND DISPLAY / TAP TO RETRIEVE`) | The wall sends that module back |
| Wall | tap a module | Expands it in the inspector between the header and a dock strip. Other modules shrink into minimised previews in the dock |
| Wall | tap the expanded module again, **✕**, or Esc | Collapses the inspector |
| Wall | tap a different module while expanded | Switches the inspector to that module |
| Wall | **RETURN TO TABLET** | Explicit return: closes the inspector and throws the module back |
| Wall | flick a module downward (grid or dock) | Sends it back directly |

Opening the inspector never blocks a handoff. Modules keep their real positions in the dock and keep flying and landing while it is open (an incoming module lands in its dock slot). If the inspected module leaves the wall, whether flicked down or retrieved from the tablet, the inspector closes itself.

`prefers-reduced-motion: reduce` stops all decorative loops (visualization motion, blinking indicators, hint arrow) and makes inspector and slot transitions near-instant. The user-initiated throw itself still moves, because it is the interaction.

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
  "objectId": "module-eos",
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
lib/handoff/                (engine — unchanged by the PROXIMA redesign)
  types.ts              HandoffEvent, DeviceRole, event payloads
  transport.ts          Transport interface + createTransport() (picks Supabase or local)
  supabaseTransport.ts  Supabase Realtime broadcast channel
  broadcastTransport.ts BroadcastChannel fallback
  useRoomSession.ts     room join, presence/heartbeat, latency estimate (RoomSession)
  gesture.ts            VelocityTracker (least squares over last 90 ms) + analyzeThrow
  trajectory.ts         planExit / planEntry: gesture → motion on each screen
  motion.ts             Pose, rAF tween, momentum spring
  useThrowable.ts       drag / throw / catch state machine for one object
  objects.ts            re-exports the mission modules as the throwable catalog
  layout.ts / useSlots  resting slots per screen; "grid" and "dock" (wall inspector open) modes
  room.ts               room codes
lib/mission/                (content layer)
  theme.ts              palette tokens (mirrored as CSS variables in app/globals.css)
  content.ts            ALL mission copy: MISSION strings + CONTENT per module
  modules.ts            content + id + accent colour → MODULES
components/
  ControllerView.tsx    /controller (tablet terminal, docks, hint, inspector)
  DisplayView.tsx       /display (wall header, grid/dock, inspector)
  ThrowableObject.tsx   one module in its slot
  PairingPanel.tsx      QR + room code
  mission/
    MissionHeader.tsx       header + status indicators
    ModulePreview.tsx       the cartridge (number, status, visual, name, summary, facts)
    ModuleInspector.tsx     expanded view (region mode on the wall, full screen on the tablet)
    ModuleVisual.tsx        picks the visualization for a module
    VesselVisualization.tsx     01 EOS: layered parallax vessel schematic
    NavigationVisualization.tsx 02: illustrative trajectory plot with moving marker
    CommandVisualization.tsx    03: abstract ID plates + succession chevrons (no portraits)
    AnomalyVisualization.tsx    04: occluded, noise-displaced scope view of the structure
```

### Assets

There are no image assets. Every visual is inline SVG (viewBox `960×600`, `card` and `full` variants) animated with CSS and SMIL, so nothing is fetched and no dependencies were added. Stars are placed deterministically so server and client renders match. `app/icon.svg` is the favicon. Fonts use system stacks (`--font-sans`, `--font-mono`) and are not downloaded.

### Content rules

All copy lives in `lib/mission/content.ts`. It states only established facts: Eos is a generation ship carrying 10,000 people to Proxima Centauri; Captain Elena precedes Captain Sophia; the voyage is multigenerational; Atlas uses nuclear pulse propulsion; a mysterious structure lies near Proxima. There are no dates, distances, speeds, specs, dialogue, biographies or portraits. The structure's origin and purpose are shown as `UNRESOLVED`. Each visualization carries a label such as *CONCEPTUAL VISUALIZATION · NOT A CANONICAL SCHEMATIC* or *ILLUSTRATIVE PLOT · NOT TO SCALE*. To add a module, add a `ModuleKey`, a `CONTENT` entry, an accent in `modules.ts` and a visualization in `ModuleVisual.tsx`. The layout adapts to the count.

UI components never touch a transport. They use `useRoomSession` and `useThrowable`.

## Limitations

- Tested only in headless Chromium: two pages in one browser over `BroadcastChannel`, at 1920×1080, 1920×1080@2x (4K), 1366×768, and 1180×820 / 820×1180 / 744×1133 tablet viewports, with mouse-emulated flicks. **Not tested on a real iPad, TV or touch hardware**, and not over Supabase from the test environment.
- On the wall, dock previews are small on phone-sized screens. The target is iPad and larger.
- Moving slots between grid and dock is a CSS transition. A module being dragged or in flight while the slots change will settle to its new slot at the end of its motion.
