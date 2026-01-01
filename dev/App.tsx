import React, { useEffect, useState } from "react";
import PeekElement from "../src/react-peek-element";
import dummy from "./dummy";

import "./App.css";

function Header(props: { count: number; hide: () => void; show: () => void }) {
  const { count, hide = Function.prototype, show = Function.prototype } = props;
  useEffect(() => {
    show();
  }, [show, count]);

  return (
    <header>
      menu ({count}) -&nbsp;
      <button onClick={() => hide()}>hide</button>
    </header>
  );
}

function App() {
  const [count, setCount] = useState<number>(0);
  const peekConfig = { revealDuration: 200 };
  const increment = () => setCount((count) => count + 1);

  return (
    <div className="App">
      <PeekElement config={peekConfig}>{({ hide, show }) => <Header show={show} hide={hide} count={count} />}</PeekElement>

      <div className="main-content">
        <h1>menu bar will hide on scroll down + appear on scroll up</h1>
        <p>
          <em>Try scrolling down such that the menu his hidden, then click `increment`</em>
        </p>

        {dummy.map((text, i) => (
          <React.Fragment key={i}>
            <p>{text}</p>
            <button onClick={increment}>increment</button>
          </React.Fragment>
        ))}
      </div>
      <footer />
    </div>
  );
}

export default App;
