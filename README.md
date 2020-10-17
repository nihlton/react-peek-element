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
      <PeekElement config={ [config Object] }>
        [ element ]
      </PeekElement>

```
* **config** - (optional) object containing: 
  - `sizeListener` - will receive a bounding rect when the dimensions or scroll position of the element changes.
  - `parentProps`, `childProps`, `placeHolderProps` - Entry values will be spread into the respective elements.  Apply classNames, styles, event handlers etc. **Use with caution**.

**Notes:**

* The element wrapping your child element will have convenience classes applied while scrolling, so you can restyle your element as needed.
  - scrolling-up
  - scrolling-down
  - *To do: make these configurable.*
  
```css
	.my-element { box-shadow: none; }
	.scrolling-up .my-element,
	.scrolling-down .my-element {
		box-shadow: 0 1rem 3rem #0001, 0 0 .5rem #0002;
	}
```
