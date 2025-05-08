/* 지갑 연결 코드 */
import { switchToSepolia } from "./utils/switchNetwork";
import React from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

function WalletConnect({ setAccount , account }) {
  const navigate = useNavigate();
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("❌ MetaMask가 설치되어 있지 않습니다. 설치 후 다시 시도해주세요!");
      return;
    }


    try {

      await switchToSepolia(); // Sepolia 전환
      // 지갑 연결 요청
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]); // 첫 번째 지갑 주소 저장
      console.log("연결된 계정:", accounts[0]); 
    } catch (error) {
      // 에러 발생 시 콘솔에 에러 메시지 출력
      console.error("지갑 연결 실패:", error.message);
    }
  };

  return (
        <button onClick={connectWallet} className="loginbutton">
          MetaMask로 로그인
        </button>
  );
}

export default WalletConnect;

