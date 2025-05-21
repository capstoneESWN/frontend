import { BrowserProvider, Contract } from "ethers";
import DIDRegistry from "../contracts/DIDRegistry.json";

const getDidDocument = async (account) => {
  try {
    console.log("getDidDocument에 전달된 account:", account); // 추가해보자
    console.log("DID 컨트랙트 주소:", process.env.REACT_APP_DID_CONTRACT_ADDRESS);

    const provider = new BrowserProvider(window.ethereum);

    // 네트워크가 준비될 때까지 대기
    await provider.getNetwork();

    const signer = await provider.getSigner();
    console.log("✅ signer address:", await signer.getAddress());

    const contract = new Contract(
      process.env.REACT_APP_DID_CONTRACT_ADDRESS,
      DIDRegistry.abi,
      signer
    );

    const document = await contract.getDID(account);
    console.log("📄 블록체인에서 조회한 DID 문서:", document);
    if (document && document !== "") {
      return JSON.parse(document); // JSON 문자열을 객체로 파싱
    }
    return null;
  } catch (error) {
    console.error("DID 조회 중 오류:", error);
    return null;
  }
};

export default getDidDocument;

