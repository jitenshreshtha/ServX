import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditUser from "../components/EditUser";

const EditUserPage = () => {
  return (
    <>
      <Header />
      <div className="container py-4">
        <EditUser />
      </div>
      <Footer />
    </>
  );
};

export default EditUserPage;
