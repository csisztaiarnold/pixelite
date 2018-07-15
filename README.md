# Pixelite v0.1.2
A Commodore 64 pixel editor made in HTML5/JS

Thanks for JackAsser for the idea ;)

![Pixelite](https://i.imgur.com/ymENzfl.png)

Currently it ~~is just a very early proof of concept~~ could function as a full-fledged pixel editor for creating Commodore 64 hires images (320x200px, 2 colors per 8x8 char area). Still a lot to do!

- grid (character indicator overlay is functioning, though)
- ~~hires and~~ multicolor graphics modes
- ~~hires and~~ multicolor color clash handling
- ~~undo~~ TODO: may be a bit buggy (not a bug actually, but undo state is saved even when putting down a pixel with the same exact color). Refactor, and limit buffer states
- redo (?)
- bigger canvas than 320x200
- confirm on clearing screen
- preview window locator overlay
- better zoom handling
- import/export
- ~~ditherbrushes~~ possibility
- change color under cursor
- (configurable) keyboard shortcuts
- brush editor
- only tested on Chrome yet

## Preview current state

https://pixelite.idevele.com

## Help

- Move main canvas with cursor buttons
- Drag any window to move
- Click on preview window to activate
- Zoom in/out activated preview with mousewheel
- Save with right click > Save As...

## Running locally

Since Chrome has some cross-origin issue if index.html is simply loaded into the browser, the best way to running the app locally is to run it in a server. For me, the easiest way was to install to run NodeJS's http-server and run it from the root of the project. So something like this, assuming NodeJS (and npm) is already installed:

~~~
npm install http-server -g
cd /home/Projects/pixelate
http-server ./
~~~

## History

### v0.1.2

- A quite fast and memory friendly undo feature (invoked by CTRL+Z)
- Brush shortcut (invoked by B)

### v0.1.1

- Disabled context menu, ie. right click
- Added secondary color which could be invoked by right click
- Force save by clicking on a floppy icon (image opens in new tab)
- Small fixes

### v0.1

- First considerable, actually useful release
- Added dither brush support
- Refactoring/code cleanup, commenting
- Added warning message before closing tab