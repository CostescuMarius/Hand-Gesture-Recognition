import "../css/GlobalStyle.css";

import React from "react";

import { Grid } from "@mui/material";

import AppHeader from "../shared/AppHeader.jsx";
import AppCard from "./AppCard.jsx";

/**
 * Component responsible for hand gesture recognition.
 * @returns {JSX.Element} The JSX representation of the Main Page component.
 */
export default function AppContainer() {

  return (
      <Grid container direction="column">
        {/* Header Section */}
        <Grid item container>
          <AppHeader showLogoutButton={true} />
        </Grid>
        {/* Hand Gesture Recognition Section */}
        <Grid item container>
          <AppCard />
        </Grid>
      </Grid>
  );
};