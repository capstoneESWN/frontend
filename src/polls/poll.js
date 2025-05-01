import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // ethers.js 임포트

// Base64 문자열을 ArrayBuffer로 변환하는 함수
function base64ToArrayBuffer(base64) {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Base64 입력값이 유효하지 않습니다.');
  }
  const binaryString = atob(base64.replace(/\s/g, ""));
  const length = binaryString.length;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

// Base64로 인코딩된 키를 CryptoKey 객체로 변환하는 함수
async function importKeyFromBase64(base64Key, isPrivateKey) {
  const cleanedBase64 = base64Key.replace(/\s/g, "");
  const keyBuffer = base64ToArrayBuffer(cleanedBase64);
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

const Poll = ({ question, options, minAge, maxAge, account, vp }) => { // 🔄 변경됨
  const [votes, setVotes] = useState(Array(options.length).fill(0));
  const [hasVoted, setHasVoted] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyVP = async () => {
      if (!account || !vp) return; // 🔄 변경됨

      try {
        // 🔄 로컬스토리지에서 불러오던 부분 제거됨
        // const vp = JSON.parse(localStorage.getItem('verifiablePresentation'));

        console.log('VP 데이터:', vp);
        console.log('VP proof:', vp.proof);
        const vc = vp.verifiableCredential?.[0];

        if (!vc || !vc.proof || !vc.proof.signature) {
          console.error('VC 또는 VC 서명이 유효하지 않습니다.');
          setIsVerified(false);
          return;
        }
        if (!vp.proof || !vp.proof.signature) {
          console.error('VP 서명이 유효하지 않습니다.', vp.proof);
          setIsVerified(false);
          return;
        }

        const publicAuthorityKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
        const publicAuthorityKey = await importKeyFromBase64(publicAuthorityKeyBase64, false);

        const vcDataToVerify = JSON.stringify({
          type: vc.type,
          credentialSubject: vc.credentialSubject,
          issuedAt: vc.issuedAt,
        });

        const vcSignatureBuffer = base64ToArrayBuffer(vc.proof.signature);
        const vcEncodedData = new TextEncoder().encode(vcDataToVerify);
        const isAuthorityValid = await crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          publicAuthorityKey,
          vcSignatureBuffer,
          vcEncodedData
        );

        console.log("isAuthorityValid:", isAuthorityValid);

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
            verifiableCredential: JSON.stringify(vp.verifiableCredential[0]),
          },
        };

        const recoveredAddress = ethers.verifyTypedData(
          typedData.domain,
          { VP: typedData.types.VP },
          typedData.message,
          vp.proof.signature
        );

        const isPersonalValid = recoveredAddress.toLowerCase() === account.toLowerCase();
        console.log("isPersonalValid:", isPersonalValid, "recoveredAddress:", recoveredAddress);

        if (!isAuthorityValid || !isPersonalValid) {
          console.error('서명 검증 실패:', { isAuthorityValid, isPersonalValid });
          setIsVerified(false);
          return;
        }

        setIsVerified(true);

        const age = parseInt(vc.credentialSubject.age, 10);
        setUserAge(age);

        if (age >= minAge && age <= maxAge) {
          setIsEligible(true);
        } else {
          setIsEligible(false);
        }

        const pollId = `${account}-${question}`;
        if (localStorage.getItem(pollId)) {
          setHasVoted(true);
        }
      } catch (error) {
        console.error('VP 검증 실패:', error);
        setIsVerified(false);
      }
    };

    verifyVP();
  }, [account, question, minAge, maxAge, vp]); // 🔄 vp를 의존성에 추가

  const handleVote = (index) => {
    if (!hasVoted && isEligible && isVerified) {
      const newVotes = [...votes];
      newVotes[index] += 1;
      setVotes(newVotes);
      setHasVoted(true);

      const pollId = `${account}-${question}`;
      localStorage.setItem(pollId, 'true');
    }
  };

  if (!account) return <div>지갑을 연결해주세요.</div>;
  if (!isVerified) return <div>VP 검증에 실패했습니다.</div>;
  if (userAge === null) return <div>VP에서 나이를 확인 중입니다...</div>;
  if (!isEligible) return (
    <div>
      이 설문조사는 {minAge}세 이상 {maxAge}세 이하만 참여 가능합니다. (당신의 나이: {userAge})
    </div>
  );

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px 0' }}>
      <h3>{question}</h3>
      {options.map((option, index) => (
        <div key={index} style={{ margin: '5px 0' }}>
          <button
            onClick={() => handleVote(index)}
            disabled={hasVoted}
            style={{
              padding: '5px 10px',
              backgroundColor: hasVoted ? '#e0e0e0' : '#007bff',
              color: hasVoted ? '#666' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: hasVoted ? 'not-allowed' : 'pointer',
            }}
          >
            {option} - {votes[index]} 표
          </button>
        </div>
      ))}
    </div>
  );
};


export default Poll;