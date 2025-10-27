/* 지갑 연결 코드 */
import { switchToSepolia } from "./utils/switchNetwork";
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

function WalletConnect({ setAccount, account }) {
  const navigate = useNavigate();
  const [availableAccounts, setAvailableAccounts] = useState([]);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("❌ MetaMask가 설치되어 있지 않습니다. 설치 후 다시 시도해주세요!");
      return;
    }


    try {

      await switchToSepolia(); // Sepolia 전환
      // 지갑 연결 요청
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAvailableAccounts(accounts); // 전체 계정 저장
      setAccount(accounts[0]); // 기본으로 첫 번째 계정 선택
      console.log(account);
    } catch (error) {
      // 에러 발생 시 콘솔에 에러 메시지 출력
      console.error("지갑 연결 실패:", error.message);
    }
  };

  return (
    <div>


      <button onClick={connectWallet} className="loginbutton">
        MetaMask로 로그인
      </button>
      {account && (
        <p>
          선택된 계정: <strong>{account}</strong>
        </p>
      )}
      {availableAccounts.length > 0 && (
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          {availableAccounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>
      )}

      {account && <p>선택된 계정: {account}</p>}
    </div>

  );
}

export default WalletConnect;
