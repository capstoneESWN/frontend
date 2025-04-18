
export const issuerVP = async () => {
    try {
        //1.현재 연결된 지갑 주소 가져오기 
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentaccount = accounts[0];

        // 2. VC 가져오기
        const vcString = localStorage.getItem("verifiableCredential");
        if (!vcString) throw new Error("VC 없음");
        const vc = JSON.parse(vcString);

        // 3. VP 데이터 구성
        const vpPayload = {
            type: "VerifiablePresentation",
            holder: `did:ethr:${currentaccount}`,
            verifiableCredential: [vc],
        };

        // 4. EIP-712 TypedData 구성
        const typedData = {
            types: {
                EIP712Domain: [
                    { name: "name", type: "string" },
                    { name: "version", type: "string" },
                    { name: "chainId", type: "uint256" },
                    //좀 더 강화하면 여기에 스마트 계약 주소 포함 
                ],
                VP: [
                    { name: "type", type: "string" },
                    { name: "holder", type: "string" },
                    { name: "verifiableCredential", type: "string" }
                ]
            },
            domain: {
                name: "YourAppName",
                version: "1",
                chainId: 11155111,  // Sepolia 테스트넷의 chainIn
                //스마트 게약 주소 포함해서 만들 것. 

            },
            primaryType: "VP",
            message: {
                type: "VerifiablePresentation",
                holder: `did:ethr:${currentaccount}`,
                verifiableCredential: JSON.stringify(vc)
            }
        };

        // 5. MetaMask를 통해 서명 요청
        const signature = await window.ethereum.request({
            method: "eth_signTypedData_v4",
            params: [currentaccount, JSON.stringify(typedData)],
        });

        // 6. VP + proof 구성
        const vp = {
            ...vpPayload,
            proof: {
                type: "Eip712Signature2021",
                created: new Date().toISOString(),
                proofPurpose: "authentication",
                verificationMethod: `did:ethr:${currentaccount}#MetaMask`,  // DID 방식 맞춰서 조정 가능
                eip712: typedData.domain,
                signature: signature
            }
        };

        // 7. 저장 및 출력
        localStorage.setItem("verifiablePresentation", JSON.stringify(vp));
        console.log("✅ VP 발급 완료:", vp);
        alert("✅ VP 발급 완료");

    } catch (err) {
        console.error("❌ VP 발급 실패:", err);
        alert("VP 발급 중 오류 발생");
    }
};