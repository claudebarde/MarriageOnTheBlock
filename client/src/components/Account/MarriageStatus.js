import React from "react";
import { Segment, Message, Button } from "semantic-ui-react";

const MarriageStatus = props => {
  const { isMarriageValid, spousesAddresses, userAddress } = props;
  const validMarriage = isMarriageValid[0] && isMarriageValid[1];
  // we arrange spouses choices in an array
  const spousesChoices = {};
  spousesChoices[spousesAddresses[0]] = isMarriageValid[0];
  spousesChoices[spousesAddresses[1]] = isMarriageValid[1];

  if (validMarriage) {
    return (
      <>
        <Segment secondary padded="very">
          <Message
            icon="thumbs up outline"
            header="The marriage is valid!"
            content="Both spouses are happily married."
            success
          />
          {spousesChoices[userAddress] ? (
            <Button fluid>Petition for divorce</Button>
          ) : (
            <Button fluid>Validate the marriage</Button>
          )}
        </Segment>
      </>
    );
  } else {
    return (
      <>
        <Segment secondary padded="very">
          <Message
            icon="thumbs down outline"
            header="The marriage is not valid!"
            content={
              !isMarriageValid[0] && !isMarriageValid[1]
                ? "Both spouses disapproved the marriage."
                : "One of the spouses disapproved the marriage."
            }
            error
          />
          {spousesChoices[userAddress] ? (
            <Button fluid>Petition for divorce</Button>
          ) : (
            <Button fluid>Validate the marriage</Button>
          )}
        </Segment>
      </>
    );
  }
};

export default MarriageStatus;
