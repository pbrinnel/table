# Build

How the design in `DESIGN.md` is built, and the order it gets built in. The house rules in
`CLAUDE.md` apply throughout.

## Physics engine

[Planck.js](https://github.com/piqnt/planck.js), a JavaScript port of Box2D, kept as a file
in the repo (`js/lib/planck.min.js`, a pinned release with its MIT license beside it).
No CDN: the page must work the same everywhere, and a pinned copy can't change under us.

Box2D already does what the design needs: weight from mass, friction, spin from off-center
hits, bounce, odd shapes built from several pieces, and a spring for dragging.

How the design maps onto it:

| Design | Planck |
|---|---|
| Overhead, nothing falls down | world gravity `(0, 0)` |
| Cloth friction stops things | one static "cloth" body; each object gets a `FrictionJoint` to it, with `maxForce = CLOTH_FRICTION * mass * g` and a matching `maxTorque`. That gives real sliding friction: things stop dead, rather than easing out forever the way damping does |
| Weight | each fixture's density, set so the body's mass matches the object's real mass |
| Drag on a spring | a `MouseJoint` per pointer, anchored where the object was grabbed, with `DRAG_MAX_FORCE`, `DRAG_HZ`, `DRAG_DAMPING`. `DRAG_MAX_FORCE` is the same for every object, so heavy ones lag |
| Falling off | no rim; a body whose center leaves the table is switched off (`setActive(false)`) and drawn tipping (squashed toward the edge line by cos of the tilt) and shrinking from then on |
| The little guy | a dynamic circle with `fixedRotation`. No cloth friction while he's up: each step, a force capped at `GUY_FORCE` steers him toward the velocity he wants. He grabs with his own `MouseJoint`, capped at `GUY_GRIP_FORCE`. Knockdowns are judged from jolts to his speed, because he's a bullet and Planck doesn't report how hard fast collisions were |
| No tunneling on a flick | cutlery and other thin, light objects are `bullet` bodies; there's a speed cap (`MAX_SPEED`) |

**Units.** Physics runs in meters and kilograms, the scale Box2D is tuned for. Drawing is in
frame units (`LW` x `LH`). One constant, `MM_PER_UNIT`, converts between them, and an
object's real size in millimeters is what it's defined in.

**Time.** A fixed step (`STEP_HZ`, 60) with an accumulator, so the physics behaves the same
at 60 Hz and 120 Hz screens. Drawing happens once per animation frame.

## The frame

- A 3:2 landscape (`LW` x `LH`, set in `js/frame.js`). The table fills it, less a margin
  where things are seen falling off.
- No scale cap: line drawings stay sharp at any size, and a large monitor gets a large
  table.
- On a portrait screen, the view is the same frame turned 90°. `frame.js` owns the turn and
  gives every other file one function to map a pointer's screen position into frame units,
  so nothing else knows the view turned.

## Files

In load order. Each declares what the ones after it use.

| File | What it does |
|---|---|
| `js/lib/planck.min.js` | Physics engine (pinned, vendored) |
| `js/frame.js` | The frame, scaling, the portrait turn, screen-to-frame mapping |
| `js/look.js` | Line and fill style (`LINE_WIDTH`, ink, paper) and small drawing helpers |
| `js/table.js` | The table's size, mm-to-frame conversion, and the starting layout |
| `js/objects.js` | The catalog: each kind of object's real size, mass, physics shape and drawing |
| `js/world.js` | The Planck world, cloth friction, falling off the edge, the fixed step |
| `js/drag.js` | Pointer events: grab, spring drag, release, one joint per pointer |
| `js/guy.js` | The little guy: choosing jobs, grabbing and hauling, knockdowns, the end |
| `js/start.js` | Builds the table and runs the loop. Last |

Positions are in mm from the table's center, x right and y down; the physics divides by
1000 for meters. Event listeners are attached from functions `start.js` calls, never at
load, so no file reads another's `canvas` while loading.

**An object kind** in `objects.js` is one entry: real size in mm, mass in g, a list of
physics pieces (circles and boxes so far, in mm, relative to its center), and a
`draw(c)` that draws it centered at the origin, unrotated, in mm, stroking only through
`inkLine`/`inkShape` (`js/look.js`) so every line keeps the same width. `start.js` and `world.js`
handle position and rotation, so a drawing never needs to know where its object is.

The physics shape is simpler than the drawing where that's invisible: a fork's tines are
drawn, but it collides as a handle and a head.

## Labs

- `_labs/tune.html` (built): the real table with a slider for every feel constant (cloth
  friction, each drag constant, falling, speed cap, line width, grab slop, the guy). Values
  apply live. "Copy values" gives them as `const` lines to paste into the code. Planned for
  step 3: a mass slider per object kind.
- `_labs/objects.html` (planned, step 2): every object kind drawn large, its physics pieces
  overlaid in a second color, so drawing and collision shape can be checked against each
  other.

## Build order

Each step ends with something to try on the slider page.

1. **Engine and frame. Done.** Planck vendored, the frame, the portrait turn, spring drag,
   cloth friction, a test layout, `_labs/tune.html`.
   - **Then, from Paul's ideas: the little guy, falling off the edge, and his ending. Done.**
2. **Objects.** The catalog filled in with the kinds chosen from `DESIGN.md`, one by one, and
   `_labs/objects.html`. *Delegated to `builder` (Sonnet), a few kinds per brief, against the
   pattern the first plate set. Lead reviews each drawing and shape.*
3. **The set table.** Starting layout of place settings, mass sliders. Two-finger drag is
   already in the code (one joint per pointer) but hasn't been tried on a real phone.
   *Lead lays out; `builder` does the mass sliders.*
4. **Tuning pass.** Paul tunes on the slider page; the chosen values go into the code.

## Things a real player will hit

- Thin cutlery is hard to grab with a finger: `GRAB_SLOP`.
- A finger lifted off the screen's edge, or a phone call interrupting a drag: release on
  `pointerup`, `pointercancel` and lost pointer capture alike, so no object stays held.
- Dragging something hard into another object: the spring's force ceiling keeps it from
  shaking or punching through.
- A fast flick of a fork through a crowd: bullets and the speed cap.
- Turning the phone mid-drag: the view turns, and held objects are released.
