import React from 'react';

interface TheadProps {
  children: React.ReactNode;
  className?: string;
}

const Thead: React.FC<TheadProps> = ({ children, className = '' }) => (
  <thead className={className}>{children}</thead>
);

export default Thead;
