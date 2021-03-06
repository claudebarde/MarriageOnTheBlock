import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "./index.css";
import App from "./components/App";
import RegisterCertificate from "./components/RegisterCertificate";
import CheckCertificate from "./components/CheckCertificate/CheckCertificate";
import ViewCertificate from "./components/ViewCertificate";
import Navbar from "./components/Navbar";
import GlobalContext from "./components/GlobalContext";
import Account from "./components/Account/Account";
import Donations from "./components/Donations";
import "./App.css";
import * as serviceWorker from "./serviceWorker";
import "./config/firebaseConfig";

const routing = (
  <Router>
    <GlobalContext>
      <Navbar />
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/register/:blockchain?" component={RegisterCertificate} />
        <Route
          path="/check/:blockchain?/:address"
          component={CheckCertificate}
        />
        <Route path="/check/:blockchain?" component={CheckCertificate} />
        <Route
          path="/certificate/:blockchain?/:address"
          component={ViewCertificate}
        />
        <Route path="/account" component={Account} />
        <Route component={App} />
      </Switch>
      <Donations />
    </GlobalContext>
  </Router>
);

ReactDOM.render(routing, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
