// utils/saveDidDocument.js
import { BrowserProvider, Contract } from "ethers";
import DIDRegistry from "../contracts/DIDRegistry.json";

const saveDidDocument = async (account, didDocument) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new Contract(
      process.env.REACT_APP_DID_CONTRACT_ADDRESS,
      DIDRegistry.abi,
      signer
    );

    const didDocString = JSON.stringify(didDocument); // 객체 → JSON 문자열

    const tx = await contract.registerDID(didDocString);
    await tx.wait(); // 트랜잭션 마이닝 완료 대기

    console.log("✅ DID 문서가 블록체인에 저장되었습니다.");
    return true;
  } catch (error) {
    console.error("❌ DID 저장 중 오류:", error);
    return false;
  }
};

export default saveDidDocument;
