/* DID 문서 유무 판단 코드, 서명 검증 함수 활성화 코드 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticate } from "./authenticate"; // 인증 관련 함수 임포트
import "./App.css";

function DIDForm({ account }) {
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState("");
  const [showalarm, setShowalarm] = useState(false);
  const [didDocument, setDidDocument] = useState(null); // DID 문서 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [isValidSignature, setIsValidSignature] = useState(null); // 서명 검증 상태
  const [message, setMessage] = useState(""); // 서명할 메시지
  const [signature, setSignature] = useState(""); // 서명

  useEffect(() => {
    if (account) {
      const did = `did:ethr:${account}`; // 지갑 주소를 기반으로 DID 생성
      setLoading(true);

      // DID 예시 문서 (실제로는 블록체인에 기록되어야 함)
      const exampleDIDDocuments = {
        "did:ethr:0x0dd5e6d8bb1e7fed45cc09cfdc2b858bab2d3c0": {
          id: "did:ethr:0x0dd5e6d8bb1e7fed45cc09cfdc2b858bab2d3c0a",
          publicKey: [
            {
              id: "did:ethr:d1ec335528e540e0d14e74d206df85740736e950#key-1",
              type: "Secp256k1VerificationKey2018",
            },
          ],
          authentication: [
            {
              type: "Secp256k1SignatureAuthentication2018",
              publicKey: "did:ethr:d1ec335528e540e0d14e74d206df85740736e950#key-1",
            },
          ],
        },
      };

      const document = exampleDIDDocuments[did];

      if (document) {
        setDidDocument(document);
        authenticateAndVerify(document); // 서명 검증을 자동으로 수행
      } else {
        setDidDocument(null);
        setAlarm("이런! 등록된 DID가 없습니다. 신원 인증 후 이용할 수 있습니다.");
        setShowalarm(true);
      }

      setLoading(false);
    }
  }, [account]);

  // 서명 검증 및 처리 함수
  const authenticateAndVerify = async (document) => {
    // 서명 검증을 위한 인증 작업
    const isValid = await authenticate(
      document,
      setMessage,
      setSignature,
      setIsValidSignature
    );
    setIsValidSignature(isValid);
  };

  const hideMessageAndNavigate = () => {
    setShowalarm(false);
    navigate("/identity-verification"); // 신원 인증 페이지로 이동
  };

  const gohome = () => {
    window.location.href = "/"; // 메인 화면으로 이동
  };

  return (
    <div>
      {/* DID 문서가 존재하지 않을 경우 메시지 표시 */}
      {showalarm && (
        <div className="message-popup">
          <p>{alarm}</p> {/* 알림 메시지 표시 */}
          <button onClick={hideMessageAndNavigate}>신원 인증하기</button>
          <button onClick={gohome}>메인 화면으로</button>
        </div>
      )}

      {/* 서명 검증 결과를 자동으로 표시 */}
      {!showalarm && didDocument && (
        <div>
          {isValidSignature !== null ? (
            <div className="message-popup">
              <p>
                {isValidSignature
                  ? "✅ 서명이 유효합니다."
                  : "❌ 서명이 유효하지 않습니다."}
              </p>

              {isValidSignature ? (
                <button onClick={() => navigate("/mainpage")}>다음</button>
              ) : (
                <button onClick={gohome}>메인 화면으로</button>
              )}
            </div>
          ) : (
            <p>서명 검증 중...</p>
          )}
        </div>
      )}

      {loading && <p>로딩 중...</p>}
    </div>
  );
}

export default DIDForm;
