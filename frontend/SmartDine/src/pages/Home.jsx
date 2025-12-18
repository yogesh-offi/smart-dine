function Home() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <h2>Please login to continue</h2>;
  }

  return <h1>Welcome to Smart Dine 🍽️</h1>;
}

export default Home;
