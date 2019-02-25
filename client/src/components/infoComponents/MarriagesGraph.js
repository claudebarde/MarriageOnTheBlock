import React, { Component } from "react";
import { Segment, Divider, Header, Loader } from "semantic-ui-react";
import CanvasJSReact from "../../config/canvasjs.react";
import upperFirst from "lodash/upperFirst";
import { MIN_SCREEN_WIDTH } from "../../config/config";

const lookup = require("country-data").lookup;
const CanvasJSChart = CanvasJSReact.CanvasJSChart;

class MarriagesGraph extends Component {
  state = {
    locations: { animationEnabled: true, data: [] },
    chartOptions: {},
    screenWidth: this.props.screenWidth
  };

  formatCountryNameForLookup = string =>
    string
      .toLowerCase()
      .replace("-", " ")
      .split(" ")
      .map(substr => upperFirst(substr))
      .join(" ");

  displayCouplesLocations = couplesLocations => {
    // we sort the values to get the highest ones first
    let sortedData = Object.keys(couplesLocations).sort(function(a, b) {
      return -(couplesLocations[a] - couplesLocations[b]);
    });
    sortedData = sortedData.slice(0, 10);
    // we prepare the chart options
    const options = {
      animationEnabled: true,
      data: [
        {
          type: "pie",
          theme: "light2",
          showInLegend: true,
          legendText: "{label} - {y}",
          dataPoints: sortedData.map(country => ({
            label: `${upperFirst(country)} ${
              lookup.countries({
                name: this.formatCountryNameForLookup(country)
              })[0]
                ? lookup.countries({
                    name: this.formatCountryNameForLookup(country)
                  })[0].emoji
                : ""
            }`,
            y: couplesLocations[country],
            indexLabel:
              this.state.screenWidth < MIN_SCREEN_WIDTH
                ? `${
                    lookup.countries({
                      name: this.formatCountryNameForLookup(country)
                    })[0]
                      ? lookup.countries({
                          name: this.formatCountryNameForLookup(country)
                        })[0].emoji
                      : ""
                  }`
                : `${upperFirst(country)} ${
                    lookup.countries({
                      name: this.formatCountryNameForLookup(country)
                    })[0]
                      ? lookup.countries({
                          name: this.formatCountryNameForLookup(country)
                        })[0].emoji
                      : ""
                  }`
          }))
        }
      ]
    };

    return options;
  };

  componentDidMount = async () => {
    // fetch locations of married couples from firestore
    const fetchLocations = this.props.firebase
      .functions()
      .httpsCallable("fetchLocations");
    try {
      const locations = await fetchLocations();
      const chartOptions = this.displayCouplesLocations(locations.data);
      this.setState({
        loadingGraph: false,
        locations: locations.data,
        chartOptions
      });
    } catch (error) {
      console.log(error);
    }
  };

  componentDidUpdate = () => {
    const { screenWidth: currentScreenWidth } = this.state;
    const { screenWidth: newScreenWidth } = this.props;

    if (currentScreenWidth !== newScreenWidth) {
      this.setState({
        screenWidth: newScreenWidth,
        chartOptions: this.displayCouplesLocations(this.state.locations)
      });
    }

    /*if (
      (currentScreenWidth <= MIN_SCREEN_WIDTH &&
        newScreenWidth > MIN_SCREEN_WIDTH) ||
      (currentScreenWidth >= MIN_SCREEN_WIDTH &&
        newScreenWidth < MIN_SCREEN_WIDTH)
    ) {
      this.setState({
        screenWidth: newScreenWidth,
        chartOptions: this.displayCouplesLocations(this.state.locations)
      });
    }*/
  };

  render() {
    return (
      <Segment textAlign="center">
        <Divider horizontal>
          <Header as="h4">Location of married couples</Header>
        </Divider>
        {this.state.loadingGraph ? (
          <Loader size="small" inline="centered" active>
            Loading
          </Loader>
        ) : (
          <CanvasJSChart options={this.state.chartOptions} />
        )}
      </Segment>
    );
  }
}

export default MarriagesGraph;
