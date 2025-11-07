"use client";

import { useEffect, useState } from "react";

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Intentar obtener sessionId de localStorage
    let id = localStorage.getItem("cartSessionId");
    
    if (!id) {
      // Generar un nuevo sessionId
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cartSessionId", id);
    }
    
    setSessionId(id);
  }, []);

  return sessionId;
}
