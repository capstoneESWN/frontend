import { BrowserProvider, Contract } from "ethers";
import DIDRegistry from "../contracts/DIDRegistry.json";

const getDidDocument = async (account) => {
  try {
    console.log("DID 컨트랙트 주소:", process.env.REACT_APP_DID_CONTRACT_ADDRESS);

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new Contract(
      process.env.REACT_APP_DID_CONTRACT_ADDRESS,
      DIDRegistry.abi,
      signer
    );

    const document = await contract.getDID(account);
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

