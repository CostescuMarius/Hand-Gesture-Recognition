import "../css/GlobalStyle.css";
import "../css/ProfileStyle.css";

import React, { useContext } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ProfileCard from "./ProfileCard.jsx";
import { Grid, LinearProgress } from "@mui/material";

import UserContext from "../context/UserContext.jsx";

/**
 * This component displays the user's profile information.
 *
 * @returns {JSX.Element} The JSX element representing the user profile page.
 */
export default function Profile() {
  const { isDataLoadingActive } = useContext(UserContext);

  return (
    <Grid container direction="column">
        {/* Header Section */}
        <Grid item container>
          <AppHeader showLogoutButton={true} />
        </Grid>

        {/* User's profile information Section */}
        {isDataLoadingActive ? (
          <Grid item xs>
            <LinearProgress />
          </Grid>
          ) : (        
          <Grid item container>
            <ProfileCard />
          </Grid>
          )}
      </Grid>
  );
};



