"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useCachedUser } from "@/hooks/useCachedUser";

// Redirect authenticated users away from auth page
export default function RouteCorrecter() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useCachedUser();

  useEffect(() => {
    if (location.pathname === "/auth" && user) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, user, navigate]);

  return null;
}
