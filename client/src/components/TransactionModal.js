import React from "react";
import { Modal, Segment, Header, Icon } from "semantic-ui-react";

export const transactionModalData = (status, txHash) => {
  if (status === "pending") {
    return {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      txHash,
      message:
        "Your transaction is being confirmed on the blockchain, please wait.",
      estimateTime: null
    };
  } else if (status === "confirmed") {
    return {
      open: true,
      icon: "thumbs up",
      loading: false,
      header: "Transaction confirmed!",
      txHash,
      message:
        "Your transaction has been successfully confirmed on the blockchain!",
      estimateTime: null
    };
  } else if (status === "error") {
    return {
      open: false,
      icon: "exclamation triangle",
      loading: false,
      header: "Transaction error!",
      txHash,
      message:
        "There was an error processing this transaction, please try again later.",
      estimateTime: null
    };
  }
};

export const TransactionModal = props => {
  const { open, header, icon, loading, message, txHash, estimateTime } = props;

  return (
    <Modal open={open} size="tiny">
      <Modal.Header className="modal-header">{header}</Modal.Header>
      <Modal.Content>
        <Segment basic placeholder>
          <Header icon>
            <Icon name={icon} loading={loading} />
            {message}
            <br />
            <br />
            <Segment
              size="tiny"
              basic
              secondary
              style={{ wordBreak: "break-word" }}
            >
              {`Transaction hash: ${txHash}`}
              <br />
              {estimateTime &&
                `Estimated waiting time: ${estimateTime} seconds`}
            </Segment>
          </Header>
        </Segment>
      </Modal.Content>
    </Modal>
  );
};
