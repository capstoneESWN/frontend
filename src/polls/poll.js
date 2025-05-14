import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// Base64 → ArrayBuffer 변환
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64.replace(/\s/g, ""));
  const buffer = new ArrayBuffer(binaryString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

// Base64 → CryptoKey 객체 변환
async function importKeyFromBase64(base64Key, isPrivateKey) {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  const keyFormat = isPrivateKey ? "pkcs8" : "spki";
  const keyUsage = isPrivateKey ? ["sign"] : ["verify"];
  return await crypto.subtle.importKey(
    keyFormat,
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    keyUsage
  );
}

const Poll = ({ question, options, minAge, maxAge, account, vp }) => {
  const [votes, setVotes] = useState(Array(options.length).fill(0));
  const [hasVoted, setHasVoted] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAlerted, setHasAlerted] = useState(false);  // 알림 상태 추가
  const [hasPosted, setHasPosted] = useState(false); // postMessage가 이미 보낸 상태인지 확인


  useEffect(() => {
    const verifyAndCheckVote = async () => {
      if (hasAlerted || hasPosted) return;  // 알림과 postMessage가 이미 처리되었으면 종료

      setLoading(true);
      if (!account || !vp) return;

      try {
        const vc = vp.verifiableCredential?.[0];
        if (!vc || !vc.proof?.signature || !vp.proof?.signature) {
          setIsVerified(false);
          return;
        }

        // 🔑 발급자 공개키 (Base64, 예시값 사용)
        const publicKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
        const publicKey = await importKeyFromBase64(publicKeyBase64, false);

        const vcData = JSON.stringify({
          type: vc.type,
          credentialSubject: vc.credentialSubject,
          issuedAt: vc.issuedAt,
        });

        const isAuthorityValid = await crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          publicKey,
          base64ToArrayBuffer(vc.proof.signature),
          new TextEncoder().encode(vcData)
        );

        const typedData = {
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
            ],
            VP: [
              { name: "type", type: "string" },
              { name: "holder", type: "string" },
              { name: "verifiableCredential", type: "string" },
            ],
          },
          domain: vp.proof.eip712,
          primaryType: "VP",
          message: {
            type: "VerifiablePresentation",
            holder: vp.holder,
            verifiableCredential: JSON.stringify(vc),
          },
        };

        const recovered = ethers.verifyTypedData(
          typedData.domain,
          { VP: typedData.types.VP },
          typedData.message,
          vp.proof.signature
        );

        const isPersonalValid = recovered.toLowerCase() === account.toLowerCase();
        let checkValidation = false;
        if (!isAuthorityValid || !isPersonalValid) {
          setIsVerified(false);
          return;
        }
        checkValidation = true;
        setIsVerified(true); 

        const age = parseInt(vc.credentialSubject.age, 10);
        setUserAge(age);

        if (checkValidation && age != null) {
          // 알림이 아직 발생하지 않았으면 알림 표시 후 상태 변경
          if (!hasAlerted) {
            alert("VP 검증 성공. 여론조사 사이트로 돌아갑니다.");
            setHasAlerted(true);  // 알림 상태를 true로 설정
          }

          // postMessage가 아직 보내지지 않았으면 한 번만 실행
          if (!hasPosted) {
            if (window.opener) {
              console.log('parent window exists:', window.opener);  // window.opener가 정상인지 확인
              // 부모 창으로 메시지 전송
              window.opener.postMessage(
                { age: age, isVerified: true },
                'http://localhost:3001'  // 부모 창의 URL을 지정
              );
            } else {
              console.log('window.opener is null or undefined');
            }

            setHasPosted(true);  // postMessage가 이미 처리되었음을 기록
          }

          // 현재 창을 닫기
          window.close();
        } else {
          console.log('Verification or age is invalid');
        }

      } catch (e) {
        console.error("VP 검증 중 오류:", e);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAndCheckVote();
  }, [account, vp, hasAlerted, hasPosted]);  // 의존성 배열에 `hasAlerted`, `hasPosted` 추가

  if (loading) return <div>로딩 중...</div>;
  if (!account) return <div>지갑을 연결해주세요.</div>;
  if (!isVerified) return <div>VP 검증에 실패했습니다.</div>;
  if (!isEligible) return <div>이 설문은 {minAge}세 이상 {maxAge}세 이하만 참여 가능합니다.</div>;
  if (hasVoted) return <div>이미 투표가 완료되었습니다.</div>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px' }}>
      <h3>{question}</h3>
      {options.map((option, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <button style={{
            padding: '8px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}>
            {option} - {votes[index]} 표
          </button>
        </div>
      ))}
    </div>
  );
};

export default Poll;
