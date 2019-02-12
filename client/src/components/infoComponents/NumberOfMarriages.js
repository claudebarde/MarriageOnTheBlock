import React from "react";
import { Segment, Divider, Header } from "semantic-ui-react";

const NumberOfMarriages = props => {
  return (
    <Segment>
      <Divider horizontal>
        <Header as="h4">Number of registered marriages</Header>
      </Divider>
      <p>
        {props.certificatesTotal > 1
          ? `There are ${props.certificatesTotal} registered
                    marriages around the world.`
          : `There is ${props.certificatesTotal} registered
                    marriage around the world.`}
      </p>
    </Segment>
  );
};

export default NumberOfMarriages;
