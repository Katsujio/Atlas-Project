import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
      <h2>Page not found</h2>
      <p style={{ marginBottom: "2rem", color: "#6b7280" }}>
        We couldn't find what you're looking for.
      </p>
      <Link className="btn btn-primary" to="/">
        Go back home
      </Link>
    </div>
  );
};

export default NotFoundPage;
