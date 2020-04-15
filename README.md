# React Peek Element [BETA]
Pin an absolutely positioned element in place as the user scrolls down, but as soon as the user scrolls up, begin revealing the element.

Useful for navigation and other persistent elements which we want highly available, but to not consume screen realestate until needed.

live demo: https://nihlton.github.io/react-peek-element/

## Installation

`npm install react-peek-element`

or

`yarn add react-peek-element`

## Usage

```js
      <PeekElement usePlaceHolder>
        [ element ]
      </PeekElement>

```

* **usePlaceHolder** - (optional) will create a statically positioned element to maintain the document flow while the element is absolutely positionined.
