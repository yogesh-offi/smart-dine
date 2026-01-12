import { Link } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoggedInHome from "./LoggedInHome";

function Home() {
  const token = localStorage.getItem("token");

  // Show landing page for non-logged users, logged-in home for logged users
  if (!token) {
    return <LandingPage />;
  }

  return <LoggedInHome />;
}

export default Home;
