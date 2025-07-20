import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerms: string[];
  allMatch: boolean;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerms, allMatch }) => {
  if (!searchTerms.length || !text) return <>{text}</>;

  // Create a combined regex for all search terms
  const escapedTerms = searchTerms.map((term) =>
  term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = searchTerms.some((term) =>
        part.toLowerCase() === term.toLowerCase()
        );

        if (isMatch) {
          return (
            <span
              key={index}
              className={`font-semibold ${
              allMatch ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`
              }>

              {part}
            </span>);

        }
        return part;
      })}
    </>);

};

export default HighlightText;