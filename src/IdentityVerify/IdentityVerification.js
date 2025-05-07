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

  const publicKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
  const privateKeyBase64 = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA2DSUsa391ITKKcoUdrUSQYe3qkHGYZ36bmdX4ycuX8z4XfrzMNgDFm3gyYyhX/wUEaAs4qJekj6B10PlZOZe8QIDAQABAkADx2t/7YwdvlJwR41zA7g1eANQUQUAKMw7SMgi+sjXOMw0727y5TXHZ3MYq/5jwZcG3oN+U6edtAuhcHLCvWwpAiEA9kCzmMRuCyTC3uwDT56TzJ6RMqtMAvqsQ/FgrPNyztUCIQDgw2g7LJLwUfAs29cT6BMRmWB3vNXeI1Lr4hIbdcS1rQIhANcLE4tR5kNG/AIOGqoZ8jnbMzMLUdq8K1k93c3K3zRtAiBBqZSnxOvgfW+XC1qYHDKF77L5CBfK37L36oGzuAIRuQIhAILrIgOlMGYUZahiDiH+sRhE127rmM9Aa4sDAgaiPJjH"


  // 추후 사용할 VC 검증 코드
  const verifyVC = async () => {
    try {
      console.log("🔹 Step 1: VC 검증 시작");

      // 저장된 VC 가져오기
      const vcString = localStorage.getItem("verifiableCredential");
      if (!vcString) {
        throw new Error("VC가 존재하지 않습니다.");
      }
      const vc = JSON.parse(vcString);
      console.log("🔹 Step 2: VC 로드 완료", vc);

      // 서명된 데이터 복원
      const dataToVerify = JSON.stringify({
        type: vc.type,
        credentialSubject: vc.credentialSubject,
        issuedAt: vc.issuedAt,
      });
      console.log("🔹 Step 3: 검증할 데이터 준비 완료", dataToVerify);

      // 공개키 가져오기
      const publicKey = await importKeyFromBase64(publicKeyBase64, false);
      console.log("✅ Step 4: 공개키 임포트 성공", publicKey);

      // 서명 Base64 디코딩
      const signatureBuffer = base64ToArrayBuffer(vc.proof.signature);
      console.log("🔹 Step 5: 서명 디코딩 완료", signatureBuffer);

      // 데이터 인코딩
      const encodedData = new TextEncoder().encode(dataToVerify);
      console.log("🔹 Step 6: 데이터 인코딩 완료", encodedData);

      // 서명 검증
      const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signatureBuffer,
        encodedData
      );

      if (isValid) {
        console.log("✅ Step 7: 서명 검증 성공 - VC가 유효합니다.");
        alert("VC 검증 성공: 신원이 유효합니다.");
      } else {
        console.log("❌ Step 7: 서명 검증 실패 - VC가 위조되었을 가능성이 있습니다.");
        alert("VC 검증 실패: 위조 가능성이 있습니다.");
      }
    } catch (error) {
      console.error("❌ 오류 발생:", error);
    }
  };


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
          return; // 함수 실행 중단
        }
      }

      console.log("🔹 Step 1: VC 발급 시작");

      // VC의 proof를 생성하기 위한 데이터
      const issuedAt = new Date().toISOString();
      const dataToSign = JSON.stringify({
        type: "VerifiableCredential",
        credentialSubject: { age: identity.age },
        issuedAt: issuedAt,
      });
      console.log("저장 age", identity.age)
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

      localStorage.setItem("verifiableCredential", JSON.stringify(vc));
      console.log("✅ Step 8: VC 저장 완료");

      alert("가 발급되어 저장되었습니다.");

      downloadVC(vc);
      alert("VC가 발급되어 저장되었습니다.");
      await verifyVC();
      gohome();


    } catch (error) {
      console.error("❌ 오류 발생:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //firebase db 설정. 
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("school", "==", school),
        where("studentId", "==", studentId),
        where("name", "==", name),
        where("age", "==", age)
      );

      const querySnapshot = await getDocs(q);

      // Firestore에서 가져온 문서들 데이터 배열로 변환
      const foundIdentities = querySnapshot.docs.map(doc => doc.data());

      // foundIdentities에서 조건에 맞는 데이터가 있는지 확인
      const isValid = foundIdentities.find(identity =>
        identity.school === school &&
        identity.studentId === studentId &&
        identity.name === name &&
        identity.age === age
      );
      foundIdentities.forEach(identity => {
        console.log("Checking:", identity);
        console.log("school:", identity.school === school);
        console.log("studentId:", identity.studentId === studentId);
        console.log("name:", identity.name === name);
        console.log("age:", identity.age === age);
      });
      console.log(isValid);
      if (isValid) {
        alert("✅ 신원이 확인되었습니다.");



        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const currentaccount = accounts[0];
          console.log("연결된 계정:", currentaccount);

          const didDoc = await getDidDocument(currentaccount);

          if (didDoc) {
            const confirmReissue = window.confirm("이미 해당 신원으로 DID 문서가 존재합니다.\nVC를 재발급하시겠습니까?");
            if (confirmReissue) {
              issueVC(isValid, true, currentaccount, didDoc); // VC 재발급
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
                  issueVC(isValid, false, currentaccount, didDoc);
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
        alert("신원 정보가 정확하지 않습니다. 다시 시도하세요.");
      }

    } catch (error) {
      console.error("❌ 처리 중 오류 발생:", error);
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

