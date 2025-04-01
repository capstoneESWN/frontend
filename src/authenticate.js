/* 서명 검증 로직 코드 */

import { recoverAddress, hashMessage } from "ethers";
import { useNavigate } from "react-router-dom";

// 인증 로직
export const authenticate = async (didDocument, setMessage, setSignature, setIsValidSignature) => {
  try {

    // 메타마스크 서명 요청
    const signature = await signMessageWithMetaMask("messagefortest"); // metamask로 보낼 메시지 실제론 Timestamp 와 같이 고유값을 넣어야함.
    setSignature(signature); // 서명 상태 업데이트
    setMessage("messagefortest");
    // 서명 검증
    const isValidSignature = await verifySignature("messagefortest", signature, didDocument);
    
    // 서명 검증 결과를 상태로 업데이트
    setIsValidSignature(isValidSignature); 

    return isValidSignature;
  } catch (error) {
    console.error("신원 인증 중 오류 발생:", error);
    // 서명 검증 실패 시 상태를 false로 설정
    setIsValidSignature(false); 
    return false;
  }
};

// 메타마스크에서 서명하는 함수
const signMessageWithMetaMask = async (message) => {
  // 메타마스크와 상호작용하여 서명 요청
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];
  const signature = await window.ethereum.request({
    method: "personal_sign",
    params: [message, account],
  });
  return signature;
};

const verifySignature = async (message, signature, didDocument) => {
  try {
    // 1. 서명된 메시지로부터 주소 복구
    // hashMessage(message) : 메시지(messagefortest) 의 해시값
    // signature : metamask가 받은 메시지(messagefortest)의 해시값에 개인키로 서명한 값.
    // recoverAddress() : 위 두 인수를 통해, 지갑 주소를 복구할수 있음. 만약. 보낸 메시지가 변조되지 않고, 사용자의 개인키로 서명(signature)
    // 이 되었다면, 올바르게 사용자의 지갑주소가 복구됨. 따라서 recoveredAddress 변수에는 사용자의 지갑 주소가 복구됨.
    const recoveredAddress = recoverAddress(hashMessage(message), signature);
    console.log("Recovered Address:", recoveredAddress);

    // 2. DID 문서에서 지갑 주소 추출 (DID 문서의 'id' 필드에서) 
    // 이는 블록체인 상 DID 문서에서 지갑 주소를 추출함. 
    const didAddress = didDocument.id.split(":")[2]; // 'did:ethr:' 부분을 제외한 지갑 주소 추출
    console.log("DID Address from DID Document:", didAddress);

    // 3. 서명이 유효한지 확인 (복구된 주소와 DID 문서의 주소 비교)
    // 1번 지갑주소와 2번 지갑주소가 일치한다면, 해당 사용자가 서명했음을 검증.
    return recoveredAddress.toLowerCase() === didAddress.toLowerCase();
  } catch (error) {
    console.error("서명 검증 중 오류 발생:", error);
    return false;
  }
};
export default authenticate;