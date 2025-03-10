import { useEffect, useState } from "react";
import FormTitle from "../../../components/front/FormTitle";
import UserAside from "../../../components/front/UserAside";

const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function UserInfo() {

  return (
    <>
      <main>
        <div className="pt-3 pb-3 pt-md-10 pb-md-25">
          <div className="container px-0 px-sm-3">
            <div className="row mx-0 mx-sm-n3">
              <div className="d-none col-lg-2 d-lg-block">
                <UserAside />
              </div>
              <div className="col-lg-10 px-0 px-sm-3">
                <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
                會員資料維護
                </h1>
                <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95">
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}