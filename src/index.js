import React from "react";
import { render } from "react-dom";
import MyMap from "./MyMap";
import "./index.css";
const App = () => (
	<div>
		<MyMap />
	</div>
);

render(<App />, document.getElementById("root"));
