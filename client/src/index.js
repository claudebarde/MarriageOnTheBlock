import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "./index.css";
import App from "./components/App";
import RegisterCertificate from "./components/RegisterCertificate";
import CheckCertificate from "./components/CheckCertificate";
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
      </Switch>
    </>
  </Router>
);

ReactDOM.render(routing, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
