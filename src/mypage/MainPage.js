
import React, { useState, useEffect } from "react";
import { issuerVP } from "../utils/issureVP";
import { useNavigate } from "react-router-dom";// 경로는 네 구조에 따라 조정
import "./mainpage.css";




const MainPage = () => {
  const navigate = useNavigate();

  const handleReissueClick = () => {
    navigate("/identity-verification"); // 👈 VC 재발급 방향으로!
  };

  const handleReVPClick = () => {
    issuerVP();
  };

  const handlePollClick = () => {
    navigate("/polls");
  }


  return (
    <div className="main-container">
      <button onClick={handleReissueClick}>VC 재발급</button>

      <button onClick={handleReVPClick}>VP 발급</button>

      <button onClick={handlePollClick}>여론조사 시작</button>
    </div>
  );
};


export default MainPage;