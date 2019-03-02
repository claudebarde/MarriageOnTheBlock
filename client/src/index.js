import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "./index.css";
import App from "./components/App";
import RegisterCertificateContextWrapper from "./components/RegisterCertificateContextWrapper";
import CheckCertificate from "./components/CheckCertificate";
import ViewCertificate from "./components/ViewCertificate";
import Navbar from "./components/Navbar";
import BlockchainSwitch from "./components/BlockchainSwitch";
import "./App.css";
import * as serviceWorker from "./serviceWorker";
import "./config/firebaseConfig";

const routing = (
  <Router>
    <>
      <BlockchainSwitch>
        <Navbar />
        <Switch>
          <Route exact path="/" component={App} />
          <Route
            path="/register/:blockchain?"
            component={RegisterCertificateContextWrapper}
          />
          <Route
            path="/check/:blockchain?/:address"
            component={CheckCertificate}
          />
          <Route path="/check/:blockchain?" component={CheckCertificate} />
          <Route
            path="/certificate/:blockchain?/:address"
            component={ViewCertificate}
          />
          <Route component={App} />
        </Switch>
      </BlockchainSwitch>
    </>
  </Router>
);

ReactDOM.render(routing, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
