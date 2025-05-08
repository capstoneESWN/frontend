import React, { useState } from 'react';
import Poll from './poll';

const pollsData = [
  {
    question: '당신이 좋아하는 색은 무엇인가요? (20대만 참여 가능)',
    options: ['빨간색', '파란색', '초록색'],
    minAge: 20,
    maxAge: 29,
  },
  {
    question: '당신이 좋아하는 음식은 무엇인가요? (30대만 참여 가능)',
    options: ['피자', '초밥', '햄버거'],
    minAge: 30,
    maxAge: 39,
  },
  {
    question: '당신이 좋아하는 프로그래밍 언어는 무엇인가요? (10대만 참여 가능)',
    options: ['JavaScript', 'Python', 'Java'],
    minAge: 10,
    maxAge: 19,
  },
];

const Polls = ({ account }) => {
  const [vpData, setVpData] = useState(null); // 🔥 업로드된 VP 저장

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setVpData(json); // 🔥 파일 읽고 JSON 저장
        alert("✅ VP 파일 업로드 성공");
      } catch (err) {
        alert("❌ 잘못된 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>여론조사 사이트</h1>

      {/* 🔥 VP 파일 업로드 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept="application/json" onChange={handleFileUpload} />
      </div>

      {/* 🔥 VP가 업로드 되었을 때만 설문 표시 */}
      {vpData ? (
        pollsData.map((poll, index) => (
          <Poll
            key={index}
            question={poll.question}
            options={poll.options}
            minAge={poll.minAge}
            maxAge={poll.maxAge}
            account={account}
            vp={vpData} // 🔥 vp를 넘김
          />
        ))
      ) : (
        <p>먼저 VP 파일을 업로드해주세요.</p>
      )}
    </div>
  );
};

export default Polls;
