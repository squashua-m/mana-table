# MTG Card Physics: Motion & Interaction Guide

## 1. Core Physics Concept
The goal is "Tactile Realism." The card should not just move; it should react to the physics of being "picked up" and "pushed" through 3D space.

## 2. Animation States

### A. The "Lift" (Drag Start)
When the user clicks/touches a card:
- **Scale:** Increase from `1.0` to `1.1`.
- **Z-Index:** Immediately jump to the highest value to clear other cards.
- **Shadow:** Transition from a sharp, close shadow to a soft, blurred "elevated" shadow.
- **Spring:** `type: "spring", stiffness: 300, damping: 20`.

### B. The "Momentum Tilt" (During Drag)
As the card moves, it should tilt on the X and Y axes based on mouse velocity.
- **Logic:** - `rotateY` = Velocity X / 20 (capped at ±15deg)
  - `rotateX` = Velocity Y / 20 (capped at ±15deg)
- **Transform Perspective:** Use `perspective(1000px)` on the container to ensure the 3D tilt is visible.

### C. The "Settle" (Drag End)
When released:
- **Scale:** Return to `1.0`.
- **Rotation:** Snap back to `0` (or the card's intended "tapped" rotation).
- **Bounce:** Use a "low-stiffness" spring to allow for a slight "jiggle" when the card hits the table.

## 3. Component Structure (For Claude)

```jsx
// Use MotionValues for high-performance tracking without re-renders
const x = useMotionValue(0);
const y = useMotionValue(0);

// Map velocity to rotation
const rotateX = useTransform(y, (v) => clamp(v / 20, -15, 15));
const rotateY = useTransform(x, (v) => clamp(v / 20, -15, 15));

return (
  <motion.div
    style={{ x, y, rotateX, rotateY, perspective: 1000 }}
    drag
    whileDrag={{ 
      scale: 1.1,
      boxShadow: "0px 20px 50px rgba(0,0,0,0.3)" 
    }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
  >
    <CardFront />
  </motion.div>
);

# MTG Card Physics: Rotational & Tapping Logic

## 1. The "Tapping" Physics (Z-Axis Rotation)
Tapping shouldn't be a linear animation. It needs to mimic the friction of a card spinning on a table surface.

### A. The "Swing" (Tapping)
- **Action:** Transition from `0°` to `90°`.
- **Spring Config:** - `stiffness: 200` (Moderate speed).
  - `damping: 12` (Low damping allows for a slight "overshoot" effect, e.g., it hits 94° and bounces back to 90°).
- **Visual Feedback:** While rotating, slightly increase the `scale` (e.g., to `1.05`) to simulate the card being pinched and turned by a finger.

### B. The "Untap" (Reset)
- **Action:** Transition from `90°` back to `0°`.
- **Spring Config:** Use a higher `stiffness` (e.g., `400`) to make untapping feel snappy and energetic—similar to a "snap" of the wrist.

## 2. Combined Physics: Tilt + Spin
When a card is "tapped," it should still respect the 3D tilt if the user is moving it at the same time.

- **Layered Transforms:** - **Outer Layer:** Handles $x/y$ position and the 3D velocity-based tilt (`rotateX`, `rotateY`).
  - **Inner Layer:** Handles the "Tapped" state (`rotateZ`).
- **Logic:** This ensures that even if a card is rotated 90°, a fast movement to the right still makes it "lift" on its edge correctly.

## 3. Interaction Logic for Claude

### Tapping Gesture
```javascript
// Example logic for Claude
const handleTap = () => {
  const targetRotation = isTapped ? 0 : 90;
  
  // Use Framer Motion's animate function for the Z-axis
  animate(rotateZ, targetRotation, {
    type: "spring",
    stiffness: 260,
    damping: 20
  });
};

### One final tip for Claude:
Ask Claude to implement a **"Sound Trigger"** placeholder at the peak of the spring overshoot. Even if you don't have audio files yet, having the logic ready to play a "snap" or "slide" sound when the rotation hits 90° will make the app feel 10x more polished later.

# MTG Card Physics: Smooth Motion & Fluid Transitions

## 1. Eliminating "Snapping" (The Dampened Tilt)
To prevent the card from jerking when changing directions (e.g., Moving Down → Moving Left), we use **Spring-Smoothed MotionValues**. 

### The "Chaser" Logic
Instead of mapping `rotateX` directly to `velocity`, we map it to a **Smoothed Velocity Value**.
- **The Library:** `framer-motion`'s `useSpring` hook.
- **How it works:** You feed the raw velocity into a spring. If the velocity suddenly changes from +500 to -500, the spring "swings" through the values in between rather than teleporting.

## 2. Updated Physics Implementation

### A. The Velocity Filter
```javascript
// 1. Get raw velocity from the drag
const { x, y } = useMotionValue(0);
const velocityX = useVelocity(x);
const velocityY = useVelocity(y);

// 2. Pass those velocities into a Spring "Filter" 
// This is what creates the "Graceful" transition
const smoothVelocityX = useSpring(velocityX, { stiffness: 100, damping: 30 });
const smoothVelocityY = useSpring(velocityY, { stiffness: 100, damping: 30 });

// 3. Map the SMOOTHED values to your rotation
const rotateY = useTransform(smoothVelocityX, [-2000, 2000], [-15, 15]);
const rotateX = useTransform(smoothVelocityY, [-2000, 2000], [15, -15]);