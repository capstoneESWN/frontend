/* 신원 인증 화면 코드 */
import saveDidDocument from "../utils/saveDidDocument";
import getDidDocument from "../utils/getDidDocument";
import { recoverAddress, hashMessage } from "ethers";
import React, { useState } from "react";
import "./IdentityVerification.css";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Firebase 초기화된 db 객체 import 경로 확인 필요



function downloadVC(vc) {
  const vcJson = JSON.stringify(vc, null, 2); // 보기 좋게 포맷팅
  const blob = new Blob([vcJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'verifiable_credential.json'; // 저장할 파일 이름
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  try {
    console.log("📌 Base64 원본:", base64);


    const binaryString = atob(base64.replace(/\s/g, ""));
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


  const issueVC = async (identity, reissue, currentaccount, didDocument) => {
  try {
    if (reissue) {
      const message = "message for VC";
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, currentaccount],
      });

      const recoveredAddress = recoverAddress(hashMessage(message), signature);
      const didAddress = didDocument.address;
      if (recoveredAddress.toLowerCase() !== didAddress.toLowerCase()) {
        alert("❌ 지갑 소유자 검증에 실패했습니다. VC 발급을 중단합니다.");
        console.error("지갑 주소 불일치:", recoveredAddress, didAddress);
        return;
      }
    }

    // 🔸 Spring Boot로 VC 요청
    const response = await fetch("http://localhost:8080/issueVC", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
       university: identity.university,
       studentId: identity.studentId,
       studentName: identity.studentName,
       age: identity.age,
      }),
    });

    if (!response.ok) {
      throw new Error("서버 응답 실패");
    }

    const vc = await response.json(); // Spring에서 발급한 VC
    console.log("✅ VC 수신 성공:", vc);
    downloadVC(vc);
    alert("VC가 발급되어 저장되었습니다.");
    gohome();

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    alert("VC 발급 중 오류 발생");
  }
};

 const handleSubmit = async (e) => {
  e.preventDefault();

  const requestData = {
    university: school,
    studentId: Number(studentId),
    studentName: name,
    age: Number(age),
  };

  try {
    const response = await fetch("http://localhost:8080/identityverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }

    const isValid = await response.json(); // true or false 반환

    if (isValid === true) {
      alert("✅ 신원이 확인되었습니다.");

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentaccount = accounts[0];
        console.log("연결된 계정:", currentaccount);

        const didDoc = await getDidDocument(currentaccount);

        if (didDoc) {
          const confirmReissue = window.confirm("이미 해당 신원으로 DID 문서가 존재합니다.\nVC를 재발급하시겠습니까?");
          if (confirmReissue) {
            issueVC(requestData, true, currentaccount, didDoc); // VC 재발급
          }
        } else {
          const confirmRegister = window.confirm("DID문서를 등록하시겠습니까?");
          if (confirmRegister) {
            const newDidDoc = {
              id: `did:ethr:${currentaccount}`,
              address: currentaccount,
            };

            const result = await saveDidDocument(currentaccount, newDidDoc);

            if (result) {
              alert("✅ DID 문서가 성공적으로 등록되었습니다.");
              const confirmVC = window.confirm("VC를 발급하시겠습니까?");
              if (confirmVC) {
                issueVC(requestData, false, currentaccount, didDoc);
              }
            } else {
              alert("❌ DID 문서 등록 중 오류가 발생했습니다.");
            }
          }
        }
      } catch (error) {
        console.error("❌ 처리 중 오류 발생:", error);
        alert("처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      }
    } else {
      alert("❌ 신원 정보가 정확하지 않습니다. 다시 시도하세요.");
    }
  } catch (error) {
    console.error("❌ 신원 인증 처리 중 오류 발생:", error);
    alert("신원 인증 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
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

