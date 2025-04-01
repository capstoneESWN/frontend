/* 메인 앱 코드 [MetaMask 설치 유무 확인 코드] */

import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import IdentityVerification from "./IdentityVerify/IdentityVerification";
import WalletConnect from "./WalletConnect";
import DIDForm from "./DIDForm";
import Authenticate from "./authenticate";
import bgImage from './assets/bg.jpg';
import MainPage from "./mypage/MainPage";
import ProtectedRoute from "./ProtectedRoute";
import './App.css';

function App() {
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [account, setAccount] = useState(null);
  const isAuthenticated = !!account;

  useEffect(() => {
    if (typeof window.ethereum === "undefined") {
      alert("❌ MetaMask가 설치되어 있지 않습니다. 설치 후 다시 시도해주세요!");
    } else {
      setHasMetaMask(true);
    }
  }, []);

  useEffect(() => {
  console.log("현재 계정:", account);  // account 상태를 콘솔에 출력
}, [account]); 

  return (
    <div className="App"> 
      <h1 className="eswn">ESWN</h1>

        <Routes>
          <Route path="/" element={
            hasMetaMask ? (
              account ? (
                <>
                  <DIDForm account={account} />
                </>
              ) : (
                <WalletConnect setAccount={setAccount} account={account} />
              )
            ) : (
              <div className="text-red-600">
                ❌ MetaMask가 설치되어 있지 않습니다.
                <br />
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  MetaMask 다운로드
                </a>
              </div>
            )
          } />
          {/* 🔒 인증이 필요한 경로들 보호 */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/identity-verification" element={<IdentityVerification />} />
          <Route path="/didform" element={<DIDForm />} />
          <Route path="/authenticate" element={<Authenticate />} />
          <Route path="/mainpage" element={<MainPage />} />
        </Route>
        </Routes>
    </div>
  );
}

export default App;
