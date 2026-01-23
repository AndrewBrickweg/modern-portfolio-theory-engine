import Layout from "../components/Layout";
import Card from "../components/Card";
import AccordianInfo from "../components/AccordianInfo";

//grab username from local storage
const storedUser = localStorage.getItem("MPT-Engine:username");
console.log("Retrieved username from localStorage:", storedUser);
const user = storedUser ? JSON.parse(storedUser).username.charAt(0).toUpperCase() + JSON.parse(storedUser).username.slice(1) : "null";
console.log("Parsed username:", user);

const UserHomepage = () => {
  return (
    <Layout>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user}!
        </h1>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Modern Portfolio Theory (MPT)
        </h2>
        <p className="text-center align-left text-gray-700 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
          Modern Portfolio Theory (MPT) is a quantitative framework developed by Harry Markowitz that formulates portfolio construction as a mean–variance optimization problem. By modeling expected returns, risk, and diversification, MPT identifies portfolios along the efficient frontier that minimize risk for a given level of expected return.
        </p>

        <AccordianInfo />
      </div>
      <div className="grid md:grid-cols gap-8 max-w-4xl mx-auto mt-12">
        <Card
          title="Portfolio Optimization"
          description="Build an optimized equities portfolio allocation by evaluating risk, return, and diversification across selected securities."
          icon={
            <svg
              className="h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          buttonText="Optimize Portfolio"
          buttonTo="/portfolio"
          hoverScale
        />
      </div>
    </Layout>
  );
};

export default UserHomepage;
