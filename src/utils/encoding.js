function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function importKeyFromBase64(base64Key, isPrivateKey) {
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
