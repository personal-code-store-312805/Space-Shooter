# Vanilla JS Space Shooter

## 1. Introduction
Hello there! Welcome to our Space Shooter Game!

This is a fast-paced, top-down arcade game built entirely with HTML5, CSS, and pure vanilla JavaScript. The objective is simple: pilot a starship, survive endless waves of enemy fighters, and rack up the highest score possible before losing the five allotted lives. This project was created to strengthen the understanding of core programming concepts like game loops, state management, and physics without relying on heavy external game engines.

## 2. Description
This game was built step-by-step using only native web technologies. The following give a breakdown of how the project comes together under the hood:

### Canvas & UI Setup
The project starts with a very lightweight HTML file containing a `<canvas>` element and a simple login overlay menu. The canvas is styled to cover the entire screen, and a JavaScript event listener constantly watches the window size, seamlessly resizing the game board if the browser window is shrunk or expanded. 

### The Game Loop & Time Management
The beating heart of the game is the engine loop, which is powered by the browser's native `requestAnimationFrame` method. Instead of moving objects by a fixed amount of pixels per frame, the loop calculates "delta time" (`dt`)—the exact fraction of a second that has passed since the last frame. By multiplying speeds by `dt`, the game ensures that the spaceship and enemies move smoothly and consistently for everyone, regardless of their monitor's refresh rate.

### Procedural Drawing
To keep the project self-contained, there are no external image files. Everything on the screen is drawn mathematically using the HTML5 Canvas 2D API (`ctx`). The cyan player ship, the red enemy rounded-rectangles, and the laser beams are all rendered using coordinate paths frame-by-frame. The game also features a scrolling starfield background where stars are assigned a random depth (`z`); smaller, dimmer stars move slower than larger, brighter ones, creating a neat 3D parallax effect.

### Physics, Controls & AI
The game accepts keyboard inputs (WASD/Arrow keys) for desktop users, but also includes touch interpolation listeners so it is fully playable on mobile devices. For physics, a custom "Axis-Aligned Bounding Box" (AABB) collision function is used to detect when lasers hit enemies or when enemy ships crash into the player. The enemies don't just fly straight down; their movement is tied to a sine wave mathematical function so they swarm naturally, and their decision to shoot is based on a random probability that gets aggressively higher as the score increases.

### Procedural Audio
Finally, instead of importing `.mp3` files, the native `AudioContext` API is utilised to synthesise sound effects directly in the browser. By creating sine wave oscillators and manipulating their frequencies and durations on the fly, the game generates retro "beeps" every time a laser is fired or a ship takes damage.

## 3. How to Download and Play
1. Download or clone this repository to a local computer.
2. Open the `index.html` file directly in any modern web browser (no local server required).
3. Enter a name in the overlay and click **Start Game**. 
4. Use the **Arrow Keys** or **WASD** (or touch and drag on a mobile screen) to move left and right. The ship will fire its lasers automatically!
