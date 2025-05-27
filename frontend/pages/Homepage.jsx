import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";

function Homepage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch("http://localhost:5000/posts");
      const data = await response.json();
      setPosts(data);
    };
    fetchPosts();
  },[]);
  return (
    <div>
      <Header />
      {/* Search Section */}
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-3">
            <select className="form-select">
              <option>Filter the Category</option>
              <option>loading</option>
              <option>loading</option>
              <option>loading</option>
            </select>
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Type here to search..."
            />
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="container mb-5">
        <h3 className="text-center mb-4">Recent Posts</h3>
        <div className="row">
          {posts.map((post) => (
            <div className="col-md-6 mb-4" key={post._id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title"> {post.title}</h5>
                  <p className="card-text">{post.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Homepage;
