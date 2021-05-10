import React from "react";
import { render } from "react-dom";
import MyMap from "./MyMap";

const App = () => (
  <div>
    <MyMap />
  </div>
);

render(<App />, document.getElementById("root"));
