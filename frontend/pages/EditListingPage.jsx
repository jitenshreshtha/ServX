import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditListing from "../components/EditListing";

const EditListingPage = ({ mode = "admin" }) => {
  return (
    <>
      <Header />
      <div className="container py-4">
        <EditListing mode={mode} />
      </div>
      <Footer />
    </>
  );
};

export default EditListingPage;
