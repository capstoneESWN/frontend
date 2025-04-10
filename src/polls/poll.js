import React, { useState, useEffect } from 'react';

// Base64 문자열을 ArrayBuffer로 변환하는 함수 (IdentityVerification.js에서 가져옴)
function base64ToArrayBuffer(base64) {
  // 공백 제거 후 Base64 디코딩
  const binaryString = atob(base64.replace(/\s/g, ""));
  const length = binaryString.length;
  // ArrayBuffer 생성
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  // 바이너리 데이터를 ArrayBuffer에 채움
  for (let i = 0; i < length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

// Base64로 인코딩된 키를 CryptoKey 객체로 변환하는 함수 (IdentityVerification.js에서 가져옴)
async function importKeyFromBase64(base64Key, isPrivateKey) {
  // 공백 제거 후 Base64를 ArrayBuffer로 변환
  const cleanedBase64 = base64Key.replace(/\s/g, "");
  const keyBuffer = base64ToArrayBuffer(cleanedBase64);
  // 키 형식을 비밀키(pkcs8) 또는 공개키(spki)로 결정
  const keyFormat = isPrivateKey ? "pkcs8" : "spki";
  const keyUsage = isPrivateKey ? ["sign"] : ["verify"]; // 키 사용 목적 설정
  // Web Crypto API로 키 임포트
  return await crypto.subtle.importKey(
    keyFormat,
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, // RSA 서명 알고리즘
    true, // 키 추출 가능 여부
    keyUsage
  );
}

// Poll 컴포넌트: 설문조사를 렌더링하고 VP 검증 및 투표 처리
const Poll = ({ question, options, minAge, maxAge, account }) => {
  // 상태 정의
  const [votes, setVotes] = useState(Array(options.length).fill(0)); // 각 선택지의 투표 수
  const [hasVoted, setHasVoted] = useState(false); // 사용자가 투표했는지 여부
  const [userAge, setUserAge] = useState(null); // VP에서 추출한 사용자 나이
  const [isEligible, setIsEligible] = useState(false); // 나이 범위에 따른 참여 자격
  const [isVerified, setIsVerified] = useState(false); // VP 서명 검증 결과

  // VP 검증 및 나이 추출을 위한 useEffect
  useEffect(() => {
    const verifyVP = async () => {
      // 계정이 없으면 종료
      if (!account) return;

      try {
        // localStorage에서 VP 데이터 가져오기 (현재는 VC로 저장된 데이터 사용)
        const vpString = localStorage.getItem('verifiableCredential');
        if (!vpString) {
          console.error('VP가 존재하지 않습니다.');
          return;
        }

        // VP 파싱 및 VC 추출
        const vp = JSON.parse(vpString);
        const vc = vp.verifiableCredential; // VP 내 VC 데이터

        // 공공기관 공개키 (하드코딩, 실제 키로 대체 필요)
        const publicAuthorityKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
        const publicAuthorityKey = await importKeyFromBase64(publicAuthorityKeyBase64, false);

        // 개인 공개키 가져오기 (MetaMask에서 가져왔다고 가정)
        const personalPublicKeyBase64 = await getPersonalPublicKey(account);
        const personalPublicKey = await importKeyFromBase64(personalPublicKeyBase64, false);

        // 공공기관 서명 검증 (VC 서명)
        const vcDataToVerify = JSON.stringify({
          type: vc.type,
          credentialSubject: vc.credentialSubject,
          issuedAt: vc.issuedAt,
        });
        const vcSignatureBuffer = base64ToArrayBuffer(vc.proof.signature); // VC 서명 디코딩
        const vcEncodedData = new TextEncoder().encode(vcDataToVerify); // 데이터 인코딩
        const isAuthorityValid = await crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          publicAuthorityKey,
          vcSignatureBuffer,
          vcEncodedData
        );

        // 개인 서명 검증 (VP 서명)
        const vpDataToVerify = JSON.stringify({
          verifiableCredential: vp.verifiableCredential,
        });
        const vpSignatureBuffer = base64ToArrayBuffer(vp.proof.signature); // VP 서명 디코딩
        const vpEncodedData = new TextEncoder().encode(vpDataToVerify); // 데이터 인코딩
        const isPersonalValid = await crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          personalPublicKey,
          vpSignatureBuffer,
          vpEncodedData
        );

        // 서명 검증 실패 시 종료
        if (!isAuthorityValid || !isPersonalValid) {
          console.error('서명 검증 실패:', { isAuthorityValid, isPersonalValid });
          setIsVerified(false);
          return;
        }

        // 서명 검증 성공
        setIsVerified(true);

        // VC에서 나이 추출
        const age = parseInt(vc.credentialSubject.age, 10);
        setUserAge(age);

        // 나이 범위 체크
        if (age >= minAge && age <= maxAge) {
          setIsEligible(true);
        } else {
          setIsEligible(false);
        }

        // 중복 참여 체크
        const pollId = `${account}-${question}`; // 계정과 질문을 조합한 고유 키
        if (localStorage.getItem(pollId)) {
          setHasVoted(true);
        }
      } catch (error) {
        console.error('VP 검증 실패:', error);
        setIsVerified(false);
      }
    };

    // VP 검증 실행
    verifyVP();
  }, [account, question, minAge, maxAge]); // 의존성 배열

  // 개인 공개키 가져오기 함수 (현재 하드코딩, 실제 구현 필요)
  const getPersonalPublicKey = async (account) => {
    // MetaMask에서 공개키를 가져오는 로직 (임시로 하드코딩)
    return "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
  };

  // 투표 처리 함수
  const handleVote = (index) => {
    // 투표 조건: 아직 투표 안 했고, 자격 있고, VP 검증 완료
    if (!hasVoted && isEligible && isVerified) {
      const newVotes = [...votes];
      newVotes[index] += 1; // 선택지 투표 수 증가
      setVotes(newVotes);
      setHasVoted(true); // 투표 완료로 상태 변경

      // 중복 참여 방지를 위해 localStorage에 기록
      const pollId = `${account}-${question}`;
      localStorage.setItem(pollId, 'true');
    }
  };

  // 조건부 렌더링
  if (!account) return <div>지갑을 연결해주세요.</div>; // 계정 연결 안 된 경우
  if (!isVerified) return <div>VP 검증에 실패했습니다.</div>; // 서명 검증 실패
  if (userAge === null) return <div>VP에서 나이를 확인 중입니다...</div>; // 나이 추출 중
  if (!isEligible) return (
    <div>
      이 설문조사는 {minAge}세 이상 {maxAge}세 이하만 참여 가능합니다. (당신의 나이: {userAge})
    </div>
  ); // 나이 범위 불일치

  // 설문조사 UI 렌더링
  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px 0' }}>
      <h3>{question}</h3> {/* 질문 표시 */}
      {options.map((option, index) => (
        <div key={index} style={{ margin: '5px 0' }}>
          <button
            onClick={() => handleVote(index)} // 투표 버튼 클릭 시 handleVote 호출
            disabled={hasVoted} // 투표 완료 시 비활성화
            style={{
              padding: '5px 10px',
              backgroundColor: hasVoted ? '#e0e0e0' : '#007bff', // 투표 여부에 따라 색상 변경
              color: hasVoted ? '#666' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: hasVoted ? 'not-allowed' : 'pointer', // 커서 스타일 변경
            }}
          >
            {option} - {votes[index]} 표 {/* 선택지와 투표 수 표시 */}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Poll; // 컴포넌트 내보내기