/* 신원 인증 화면 코드 */


import React, { useState } from "react";
import "./IdentityVerification.css";

function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary); // Base64 인코딩
}

// Base64 문자열을 ArrayBuffer로 변환하는 함수 (디버깅용)
function base64ToArrayBuffer(base64) {
  try {
    console.log("📌 Base64 원본:", base64);

    // Base64 디코딩
    const binaryString = atob(base64.replace(/\s/g, "")); // 공백 제거 후 디코딩
    console.log("✅ Base64 디코딩 성공");

    // ArrayBuffer 생성
    const length = binaryString.length;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    console.log("✅ ArrayBuffer 변환 성공:", buffer);
    return buffer;
  } catch (error) {
    console.error("❌ Base64 → ArrayBuffer 변환 오류:", error);
    throw error;
  }
}


async function importKeyFromBase64(base64Key, isPrivateKey) {
  try {
    console.log(`🔹 키 변환 시작: isPrivateKey=${isPrivateKey}`);

    // 공백/줄바꿈 제거 후 Base64 → ArrayBuffer 변환
    const cleanedBase64 = base64Key.replace(/\s/g, ""); 
    const keyBuffer = base64ToArrayBuffer(cleanedBase64);

    console.log("✅ Base64 → ArrayBuffer 변환 완료:", keyBuffer);
    
    // 키 타입 결정
    const keyFormat = isPrivateKey ? "pkcs8" : "spki";
    const keyUsage = isPrivateKey ? ["sign"] : ["verify"];

    console.log(`🔹 키 포맷: ${keyFormat}, 용도: ${keyUsage}`);

    // 키 임포트
    const key = await crypto.subtle.importKey(
      keyFormat,
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      keyUsage
    );

    console.log("✅ 키 임포트 성공:", key);
    return key;
  } catch (error) {
    console.error("❌ 키 임포트 오류:", error);
    throw error;
  }
}




function IdentityVerification() {
  const [school, setSchool] = useState("");
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const publicKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
  const privateKeyBase64 = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA2DSUsa391ITKKcoUdrUSQYe3qkHGYZ36bmdX4ycuX8z4XfrzMNgDFm3gyYyhX/wUEaAs4qJekj6B10PlZOZe8QIDAQABAkADx2t/7YwdvlJwR41zA7g1eANQUQUAKMw7SMgi+sjXOMw0727y5TXHZ3MYq/5jwZcG3oN+U6edtAuhcHLCvWwpAiEA9kCzmMRuCyTC3uwDT56TzJ6RMqtMAvqsQ/FgrPNyztUCIQDgw2g7LJLwUfAs29cT6BMRmWB3vNXeI1Lr4hIbdcS1rQIhANcLE4tR5kNG/AIOGqoZ8jnbMzMLUdq8K1k93c3K3zRtAiBBqZSnxOvgfW+XC1qYHDKF77L5CBfK37L36oGzuAIRuQIhAILrIgOlMGYUZahiDiH+sRhE127rmM9Aa4sDAgaiPJjH"


    // 미리 설정된 신원 정보들
   const validIdentities = [
    { school: "한성대학교", studentId: "1971081", name: "김동휘", age: "25" },
    { school: "한성대학교", studentId: "1971080", name: "전지원", age: "23" },
    { school: "한성대학교", studentId: "1971079", name: "김희원", age: "23" },
    { school: "한성대학교", studentId: "1971078", name: "김민기", age: "26" }
  ];

const issueVC = async (identity) => {
  try {
    console.log("🔹 Step 1: VC 발급 시작");
    
    // VC의 proof를 생성하기 위한 데이터
    const issuedAt = new Date().toISOString();
    const dataToSign = JSON.stringify({
      type: "VerifiableCredential",
      credentialSubject: { age: identity.age },
      issuedAt: issuedAt,
    });

    console.log("🔹 Step 2: 데이터 준비 완료", dataToSign);

    // Base64 문자열을 이용해 공개키와 비밀키 임포트
    const privateKey = await importKeyFromBase64(privateKeyBase64, true);
    console.log("✅ Step 3: 비밀키 임포트 성공", privateKey);

    const publicKey = await importKeyFromBase64(publicKeyBase64, false);
    console.log("✅ Step 4: 공개키 임포트 성공", publicKey);

    // 데이터 인코딩
    const encodedData = new TextEncoder().encode(dataToSign);
    console.log("🔹 Step 5: 데이터 인코딩 완료", encodedData);

    // 서명 생성
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encodedData);
    console.log("✅ Step 6: 서명 생성 성공", signature);

    // VC 객체
    const vc = {
      type: "VerifiableCredential",
      credentialSubject: { age: identity.age },
      issuedAt: issuedAt,
      proof: {
        type: "RSASignature",
        created: issuedAt,
        proofPurpose: "assertionMethod",
        verificationMethod: "ExampleVerificationMethod",
        signature: arrayBufferToBase64(signature), // 서명
      },
    };

    console.log("🔹 Step 7: VC 객체 생성 완료", vc);

    // VC를 localStorage에 저장
    localStorage.setItem("verifiableCredential", JSON.stringify(vc));
    console.log("✅ Step 8: VC 저장 완료");

    alert("VC가 발급되어 저장되었습니다.");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
};


  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isValid = validIdentities.find(identity => 
      identity.school === school &&
      identity.studentId === studentId &&
      identity.name === name &&
      identity.age === age
    );

    if (isValid) {
      alert("신원이 확인되었습니다.");
      if (window.confirm("VC를 발급하시겠습니까?")) {
        issueVC(isValid); // VC 발급
      }
    } else {
      alert("신원 확인에 실패하였습니다. 정보를 다시 확인해주세요.");
    }
  };
    

   const gohome = () => {
    window.location.href = "/"; // 메인 화면으로 이동
  };

  return (
    <div className="identity-verification">
      <h2>신원 인증</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>학교</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
          />
        </div>
        <div>
          <label>학번</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required

          />
        </div>
        <div>
          <label>나이</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginBottom: "10px" }} >신원 인증 제출</button>
        <button type="button" onClick={gohome} >뒤로가기</button>
      </form>
    </div>
  );
}

export default IdentityVerification;
