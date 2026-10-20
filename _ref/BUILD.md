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
| Cloth friction stops things | one static "cloth" body; each object gets a `FrictionJoint` to it, with `maxForce = CLOTH_FRICTION * mass * g` and a matching `maxTorque`. That gives real sliding friction: things stop dead, rather than easing out forever the way damping does. Planck 1.5.0's friction joint has a bug (it keeps its old impulse by reference, so its linear solve does nothing and a nudged thing creeps a centimeter or two a second forever, off the table in the end); `world.js` replaces that one method with Box2D's solve and leaves the library file as released |
| Weight | each fixture's density, set so the body's mass matches the object's real mass |
| Drag on a spring | a `MouseJoint` per pointer, anchored where the object was grabbed, with `DRAG_MAX_FORCE`, `DRAG_HZ`, `DRAG_DAMPING`. `DRAG_MAX_FORCE` is the same for every object, so heavy ones lag |
| Levels | each fixture's filter puts it in one category per level, colliding only with its own. A thing resting on another is held to it by a `FrictionJoint` to that body (`RIDE_FRICTION`) instead of to the cloth, so it rides along until a jerk beats the friction. Its center leaving the support's rim starts a drop: the body is switched off, drawn tilting over the rim (the same squash as going over the edge) to a landing spot clear of the support, then switched on at level 2. Drawing and picking go by `byLevel()`. A guy putting a cup back has his body and the cup's switched off and moved by hand for the climb, the lift and the climb down |
| Draw order | `drawThings` gathers pieces with heights (`baseHeight` by level, `tallPieces` per part of a tall thing, scaled by cos of its tilt) and draws them lowest first; `drawTall` in `look.js` draws one tall thing on its own, for the labs |
| Arrivals | a backup's body is switched off and drawn at level 1, under the thing he comes out from, while a timeline moves him by hand; that thing's drawing is tilted (`enterTilt`, the same squash as tipping) or, for the napkin, its corner flap drawn tilted (`flap`). He's switched on at a clear exit spot at the end |
| Falling off | no rim; a body whose center leaves the table is switched off (`setActive(false)`) and drawn tipping (squashed toward the edge line by cos of the tilt) and shrinking from then on |
| The little guy | a dynamic circle with `fixedRotation`; there can be several (a backup joins for each object that goes over the edge), each its own body and its own grip. No cloth friction while he's up: each step, a force capped at `GUY_FORCE` steers him toward the velocity he wants. He grabs with his own `MouseJoint`, capped at `GUY_GRIP_SHARE` of the player's `DRAG_MAX_FORCE`, anchored to the cloth rather than his own body, so a tug of war moves the object but never pulls him: he follows it on foot. Knockdowns are judged from jolts to his speed, because he's a bullet and Planck doesn't report how hard fast collisions were. On foot (not hauling) he steers around anything in his way with ray casts, backed by a ring of point tests close in, since a corner can slip between two rays. Touching anything that isn't his job, he slows to `GUY_SQUEEZE_PACE`, drops his force to `GUY_SQUEEZE_FORCE`, and loses any push into it, so he slides along it. His body is frictionless (`slick`), so a scrape can't drag anything along. Hauling, when what he drags is about to bump something (ray casts ahead of it) or touches it, his pull point moves at `GUY_HAUL_CARE` of carrying speed and stays within `GUY_HAUL_LEAD_MM` of his hands |
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
| `js/look.js` | Line and fill style (`LINE_WIDTH`, ink, paper) and small drawing helpers; the fill spec `inkShape`/`inkLine` paint with |
| `js/color.js` | The palette and the fill spec for each object kind and guy; `drawThings` sets it around each draw |
| `js/table.js` | The table's size, mm-to-frame conversion, and the starting layout |
| `js/objects.js` | The catalog: each kind of object's real size, mass, physics shape and drawing |
| `js/world.js` | The Planck world, cloth friction, falling off the edge, the fixed step |
| `js/drag.js` | Pointer events: grab, spring drag, release, one joint per pointer |
| `js/guy.js` | The little guys: sharing jobs, backups arriving, grabbing and hauling, knockdowns, the end |
| `js/talk.js` | The guy's dialog box: typewriter text, portrait, the opening lines, the backup call |
| `js/glue.js` | The glue soldier: when he's called, what he glues, and the glue puddle; `inPlay()` for what's still left |
| `js/score.js` | The score: counted as things go over, shown at the end |
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

The dialog is drawn upright on the screen, through `frame.js`'s upright view, so its text
never turns with the table on a portrait phone.

## Labs

- `_labs/tune.html` (built): the real table with a slider for every feel constant (cloth
  friction, each drag constant, falling, speed cap, line width, grab slop, the guy). Values
  apply live. "Copy values" gives them as `const` lines to paste into the code. Planned for
  step 3: a mass slider per object kind.
- `_labs/objects.html` (built): every object kind drawn large, its physics pieces
  overlaid in a second color, so drawing and collision shape can be checked against each
  other.
- `_labs/spawn.html` (built): candidate arrival animations for new guys.

**Planck's skin.** Planck grows every box piece by its polygon radius, 10 mm, on all sides,
so two boxes collide about 20 mm apart and a box and a circle about 10 mm apart. The layout
leaves gaps for it. Shrinking boxes by that much in `world.js` would make collisions
honest, at the cost of thin cutlery being harder to grab.

## Build order

Each step ends with something to try on the slider page.

1. **Engine and frame. Done.** Planck vendored, the frame, the portrait turn, spring drag,
   cloth friction, a test layout, `_labs/tune.html`.
   - **Then, from Paul's ideas: the little guy, falling off the edge, and his ending. Done.**
2. **Objects. Done** for one formal place setting. The catalog filled in with the kinds chosen from `DESIGN.md`, one by one, and
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
