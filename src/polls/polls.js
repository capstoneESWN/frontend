import React from 'react';
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
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>여론조사 사이트</h1>
      {pollsData.map((poll, index) => (
        <Poll
          key={index}
          question={poll.question}
          options={poll.options}
          minAge={poll.minAge}
          maxAge={poll.maxAge}
          account={account}
        />
      ))}
    </div>
  );
};

export default Polls;