export const issuerVP = async () => {
    try {
        // 1. 파일 업로드 받기
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
                alert("파일을 선택해야 합니다.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const vcString = e.target.result;
                    const vc = JSON.parse(vcString);

                    // 2. 현재 연결된 지갑 주소 가져오기
                    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                    const currentaccount = accounts[0];

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
                            ],
                            VP: [
                                { name: "type", type: "string" },
                                { name: "holder", type: "string" },
                                { name: "verifiableCredential", type: "string" },
                            ],
                        },
                        domain: {
                            name: "YourAppName",
                            version: "1",
                            chainId: 11155111, // Sepolia
                        },
                        primaryType: "VP",
                        message: {
                            type: "VerifiablePresentation",
                            holder: `did:ethr:${currentaccount}`,
                            verifiableCredential: JSON.stringify(vc),
                        },
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
                            verificationMethod: `did:ethr:${currentaccount}#MetaMask`,
                            eip712: typedData.domain,
                            signature: signature,
                        },
                    };

                    // 7. 저장 및 다운로드
                    localStorage.setItem("verifiablePresentation", JSON.stringify(vp));
                    console.log("✅ VP 발급 완료:", vp);
                    alert("✅ VP 발급 완료");

                    downloadVP(vp);
                    alert("✅ VP 발급 및 다운로드 완료");

                } catch (readError) {
                    console.error("❌ 파일 읽기 오류:", readError);
                    alert("❌ 파일 읽기에 실패했습니다.");
                }
            };

            reader.readAsText(file);
        };

        input.click(); // 파일 선택창 띄우기

    } catch (err) {
        console.error("❌ VP 발급 실패:", err);
        alert("VP 발급 중 오류 발생");
    }
};

function downloadVP(vp) {
    const vpJson = JSON.stringify(vp, null, 2);
    const blob = new Blob([vpJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // 현재 시간 넣어서 파일명 설정
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 15);
    a.download = `verifiable_presentation_${timestamp}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}
