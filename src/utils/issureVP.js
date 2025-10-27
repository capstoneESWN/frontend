export const issuerVP = async () => {
    try {
        // 1️⃣ 파일 업로드 받기
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

                    // ✅ 1. 사용자가 VP에 포함할 필드 선택
                    const selectedFields = await selectFields(vc);
                    if (!selectedFields || selectedFields.length === 0) {
                        alert("❌ 아무 항목도 선택되지 않았습니다.");
                        return;
                    }

                    // ✅ 2. 선택된 필드만 남기기
                    const filteredVC = {};
                    for (const key of selectedFields) {
                        filteredVC[key] = vc[key];
                    }

                    // 3️⃣ 현재 연결된 지갑 주소 가져오기
                    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                    const currentaccount = accounts[0];

                    // 4️⃣ VP 데이터 구성
                    const vpPayload = {
                        type: "VerifiablePresentation",
                        holder: `did:ethr:${currentaccount}`,
                        verifiableCredential: [filteredVC], // ✅ 필터된 VC만 포함
                    };

                    // 5️⃣ EIP-712 TypedData 구성
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
                            verifiableCredential: JSON.stringify(filteredVC),
                        },
                    };

                    // 6️⃣ MetaMask 서명
                    const signature = await window.ethereum.request({
                        method: "eth_signTypedData_v4",
                        params: [currentaccount, JSON.stringify(typedData)],
                    });

                    // 7️⃣ VP + proof 구성
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

                    // 8️⃣ 다운로드
                    localStorage.setItem("verifiablePresentation", JSON.stringify(vp));
                    console.log("✅ VP 발급 완료:", vp);
                    alert("✅ 선택된 항목만 포함된 VP 발급 완료");

                    downloadVP(vp);

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


// ✅ 체크박스 UI: 선택된 항목만 VP로 포함
// ✅ credentialSubject 내부 항목만 선택하도록 수정
// ✅ 고정된 항목 5개(name, age, studentId, university, gender)만 표시
async function selectFields(vc) {
    return new Promise((resolve) => {
        const subject = vc.credentialSubject || vc;

        // 1️⃣ 표시할 항목 정의
        const targetKeys = ["name", "age", "studentId", "university", "gender"];

        // 2️⃣ 팝업 UI 생성
        const container = document.createElement("div");
        container.style.cssText = `
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white; border: 1px solid #ccc; border-radius: 10px;
            padding: 20px; z-index: 9999;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-family: sans-serif;
        `;

        const title = document.createElement("h3");
        title.textContent = "VP에 포함할 항목을 선택하세요:";
        container.appendChild(title);

        const checkboxes = [];

        // 3️⃣ 고정된 항목 5개 표시 (값은 표시하지 않음)
        targetKeys.forEach((key) => {
            const label = document.createElement("label");
            label.style.display = "block";
            label.style.marginBottom = "6px";
            label.style.cursor = "pointer";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = key;
            checkbox.style.marginRight = "6px";

            // 텍스트에는 항목명만 표시
            const labelText = document.createTextNode(key);

            label.appendChild(checkbox);
            label.appendChild(labelText);

            container.appendChild(label);
            checkboxes.push(checkbox);
        });

        // 4️⃣ 확인 버튼
        const confirmButton = document.createElement("button");
        confirmButton.textContent = "확인";
        confirmButton.style.marginTop = "10px";
        confirmButton.style.padding = "6px 12px";
        confirmButton.style.cursor = "pointer";
        confirmButton.onclick = () => {
            // 선택된 필드 확인
            const selected = checkboxes.filter(c => c.checked).map(c => c.value);

            // VC에 존재하지 않는 필드 선택 시 오류 메시지
            const missing = selected.filter((key) => subject[key] === undefined);
            if (missing.length > 0) {
                alert(`❌ 선택한 항목 중 VC에 존재하지 않는 항목이 있습니다: ${missing.join(", ")}`);
                return;
            }

            document.body.removeChild(container);
            resolve(selected);
        };

        container.appendChild(confirmButton);
        document.body.appendChild(container);
    });
}



function downloadVP(vp) {
    const vpJson = JSON.stringify(vp, null, 2);
    const blob = new Blob([vpJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    let fileName = "vp";
    try {
        const vc = vp.verifiableCredential?.[0];
        if (vc && typeof vc === "object") {
            const subject = vc.credentialSubject || vc;
            const keys = Object.keys(subject);
            if (keys.length > 0) {
                fileName += "_" + keys.join("_");
            }
        }
    } catch (err) {
        console.warn("파일명 생성 실패:", err);
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 15);
    fileName += `.${timestamp}.json`;

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
