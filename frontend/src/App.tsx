import { useState } from "react";
import logo from "./assets/images/logo-universal.png";
import "./App.css";
import { Greet } from "../wailsjs/go/main/App";

function App() {
  const [resultText, setResultText] = useState(
    "Please enter your uhhhn below if you dare, ok? 👇"
  );
  const updateResultText = (result: string) => setResultText(result);

  function greet() {
    Greet().then(updateResultText);
  }

  return (
    <div id="App">
      <img src={logo} id="logo" alt="logo" />
      <div id="result" className="result text-red-400">
        {resultText}
      </div>
      {/* <div id="input" className="input-box">
                <input id="name" className="input" onChange={updateName} autoComplete="off" name="input" type="text" />

            </div> */}
      <button className="btn" onClick={greet}>
        Greet
      </button>
    </div>
  );
}

export default App;
