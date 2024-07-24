import Header from "./Header";
import { useState } from "react";

export default function Home() {
  useState(() => {
    document.title = "SeriuxMod | Home";
  }, []);
  return (
    <div className="flex flex-col justify-start items-center min-h-screen w-screen">
      <Header />
    </div>
  );
}
