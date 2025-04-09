/* 신원 인증이 완료된 사용자 화면 코드 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./mainpage.css"

const MainPage = () => {
const navigate = useNavigate();

const handleReissueClick = () => {
    navigate("/identity-verification"); // 👈 경로 이동
  };


  return (
    <div className="main-container">
      <button onClick={handleReissueClick}>VC 재발급하기</button>
      <button>여론조사 시작하기</button>
    </div>
  );
};

export default MainPage;