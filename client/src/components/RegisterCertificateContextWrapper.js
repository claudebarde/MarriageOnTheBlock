import React from "react";

import RegisterCertificate from "./RegisterCertificate";

import { GlobalStateConsumer } from "../config/config";

const RegisterCertificateContextWrapper = () => {
  return (
    <GlobalStateConsumer>
      {context => <RegisterCertificate context={context} />}
    </GlobalStateConsumer>
  );
};

export default RegisterCertificateContextWrapper;
