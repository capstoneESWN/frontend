import { importKeyFromBase64 } from "../utils/encoding.js";  // 경로에 맞게 수정
import { jwtVerify, SignJWT } from 'jose';



const issueVP = async () => {
    try {

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentaccount = accounts[0];
        const publicKeyBase64 = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANg0lLGt/dSEyinKFHa1EkGHt6pBxmGd+m5nV+MnLl/M+F368zDYAxZt4MmMoV/8FBGgLOKiXpI+gddD5WTmXvECAwEAAQ==";
        const privateKeyBase64 = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA2DSUsa391ITKKcoUdrUSQYe3qkHGYZ36bmdX4ycuX8z4XfrzMNgDFm3gyYyhX/wUEaAs4qJekj6B10PlZOZe8QIDAQABAkADx2t/7YwdvlJwR41zA7g1eANQUQUAKMw7SMgi+sjXOMw0727y5TXHZ3MYq/5jwZcG3oN+U6edtAuhcHLCvWwpAiEA9kCzmMRuCyTC3uwDT56TzJ6RMqtMAvqsQ/FgrPNyztUCIQDgw2g7LJLwUfAs29cT6BMRmWB3vNXeI1Lr4hIbdcS1rQIhANcLE4tR5kNG/AIOGqoZ8jnbMzMLUdq8K1k93c3K3zRtAiBBqZSnxOvgfW+XC1qYHDKF77L5CBfK37L36oGzuAIRuQIhAILrIgOlMGYUZahiDiH+sRhE127rmM9Aa4sDAgaiPJjH"
        const publicKey = await importKeyFromBase64(publicKeyBase64, false);
        const privateKey = await importKeyFromBase64(privateKeyBase64, true);
        const vcString = localStorage.getItem("verifiableCredential");


        if (!vcString) throw new Error("VC 없음");





        const vc = JSON.parse(vcString);

        const vpPayload = {
            type: "VerifiablePresentation",
            holder: `did:ethr:${currentaccount}`,
            verifiableCredential: [vc],
        };


        const secret = new TextEncoder().encode(privateKey);  // 비밀 키

        const jwt = await new SignJWT({ user: vpPayload.holder })  // payload
            .setProtectedHeader({ alg: 'HS256' })  // 알고리즘 설정
            .sign(secret);  // 서명

        console.log('Generated JWT:', jwt);


        const vp = {
            ...vpPayload,
            proof: {
                type: "RSASignature",
                created: new Date().toISOString(),
                proofPurpose: "authentication",
                verificationMethod: publicKey + "#key-1",
                jwt: jwt,
            },
        };

        localStorage.setItem("verifiablePresentation", JSON.stringify(vp));
        console.log("✅ VP 발급 완료:", vp);
        alert("✅ VP 발급 완료");

    } catch (err) {
        console.error("❌ VP 발급 실패:", err);
        alert("VP 발급 중 오류 발생");
    }
};

export default issueVP;