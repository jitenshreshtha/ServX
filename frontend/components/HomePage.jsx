import React from 'react';
import Header from './Header';
import Footer from './Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

function HomePage() {
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
            <input type="text" className="form-control" placeholder="Type here to search..." />
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="container mb-5">
        <h3 className="text-center mb-4">Recent Posts</h3>
        <div className="row">
          {[1, 2, 3, 4].map((item) => (
            <div className="col-md-6 mb-4" key={item}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Post Title {item}</h5>
                  <p className="card-text">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ratione sapiente similique explicabo itaque, nam voluptatibus sit quasi earum illo numquam dolores deserunt neque quod quia, placeat excepturi a tenetur labore!</p>
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

export default HomePage;
