"use client";

import dynamicImport from "next/dynamic";
const Router = dynamicImport(() => import("@/components/Router"), {
  ssr: false,
});

export const dynamic = "force-static";

export default function Page() {
  return <Router />;
}