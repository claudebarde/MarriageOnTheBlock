import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "./index.css";
import App from "./components/App";
import RegisterCertificate from "./components/RegisterCertificate";
import CheckCertificate from "./components/CheckCertificate";
import ViewCertificate from "./components/ViewCertificate";
import Navbar from "./components/Navbar";
import "./App.css";
import * as serviceWorker from "./serviceWorker";

const routing = (
  <Router>
    <>
      <Navbar />
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/register" component={RegisterCertificate} />
        <Route path="/check/:address" component={CheckCertificate} />
        <Route path="/check" component={CheckCertificate} />
        <Route path="/certificate/:address" component={ViewCertificate} />
      </Switch>
      <div
        style={{
          position: "absolute",
          bottom: "0px",
          right: "5px",
          fontSize: "0.4rem"
        }}
      >
        <a href="https://www.freepik.com/free-photos-vectors/background">
          Background photo by prostooleh
        </a>{" "}
      </div>
    </>
  </Router>
);

ReactDOM.render(routing, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
