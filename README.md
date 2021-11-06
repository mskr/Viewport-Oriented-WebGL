# Viewport-Oriented-(Web)GL

Viewport-Oriented WebGL enables dividing your screen in arbitrary layouts, render stuff and enjoy proper event handling.

## Layout

A layout is a collection of viewports for a single screen.

## Camera

The camera concept is the process between world and viewport. It transforms 3D data into 2D image.

- Creating a camera creates a viewport, to ensure visual user feedback
- Viewports can be converted between
  - Window: new viewport creates new OS window
  - Canvas: new viewport creates new HTML canvas
  - GL viewport: new viewport creates a GL viewport in the same GL context
- Mapping of pixels (viewport) to world units (near plane) is a user parameter, to support worlds of any scale 
- Camera is also responsible for the depth precision https://developer.nvidia.com/content/depth-precision-visualized
  - However camera can do nothing about model resolution, i.e. minimum vertex distance, and scale, i.e. maximum vertex distance
  - The camera frustum has to be seen as integrated part of the rendered data, at least during rendering

## Renderer

The renderer represents a graphics device.

A single renderer can show multiple viewports in a layout.

However, multiple viewports can also use multiple renderers in a multi-device setup.
