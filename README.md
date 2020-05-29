![React Peek Element](https://repository-images.githubusercontent.com/255969830/7bbc4000-847b-11ea-8bd1-fb940207482c)

# React Peek Element [BETA]
Allow a UI element to scroll off screen as the user scrolls down, but as soon as the user scrolls up, begin revealing the element.

Useful for navigation and other persistent elements which we want highly available, but to not consume screen realestate until needed.

[live demo](https://codesandbox.io/s/dazzling-ishizaka-n4d8y?file=/src/index.js)

## Installation

`npm install react-peek-element`

or

`yarn add react-peek-element`

## Usage

```js
      <PeekElement usePlaceHolder zIndex="1234">
        [ element ]
      </PeekElement>

```

* **usePlaceHolder** - (optional) will create a statically positioned element to maintain the document flow while the element is absolutely positionined.

* **zIndex** - (default: 4000) set the z-index on the outermost wrapper

**Notes:**

* The parent element will have convenience classes applied while scrolling, so you can restyle your element as needed.
  - scrolling-up
  - scrolling-down

```css
	.my-element { box-shadow: none; }
	.scrolling-up .my-element,
	.scrolling-down .my-element {
		box-shadow: 0 1rem 3rem #0001, 0 0 .5rem #0002;
	}
```
