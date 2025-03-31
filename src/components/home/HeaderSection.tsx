
import React from "react";
import Header from "@/components/layout/Header";

interface HeaderSectionProps {
  isScrolled: boolean;
}

const HeaderSection = ({ isScrolled }: HeaderSectionProps) => {
  return <Header isScrolled={isScrolled} variant="home" />;
};

export default HeaderSection;
